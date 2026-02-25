import { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { sendEmail } from "@/core/email";
import { getEnv } from "@/core/env";

export async function sendTrackingEmailsForUpdates(updates: {
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: "SHIPPED" | "DELIVERED";
  detail: string;
}[]) {
  for (const update of updates) {
    const order = await db.order.findUnique({ where: { id: update.orderId } });
    if (!order) {
      continue;
    }

    const trackingText = update.trackingUrl
      ? `<a href="${update.trackingUrl}">${update.trackingNumber}</a>`
      : update.trackingNumber;

    await sendEmail({
      to: order.email,
      subject: `Order ${order.orderNumber} ${update.status.toLowerCase()}`,
      html: `<p>${update.detail}</p><p>Tracking: ${trackingText}</p>`,
    });
  }
}

export async function runLowStockAlertSweep() {
  const products = await db.product.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      inventory: true,
      lowStockThreshold: true,
      updatedAt: true,
    },
  });

  const env = getEnv();
  const alerts = [] as { productId: string; inventory: number }[];

  for (const product of products) {
    if (product.inventory > product.lowStockThreshold) {
      continue;
    }

    const alreadySent = await db.lowStockAlert.findFirst({
      where: {
        productId: product.id,
        sentAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (alreadySent) {
      continue;
    }

    await db.lowStockAlert.create({
      data: {
        productId: product.id,
        inventory: product.inventory,
        threshold: product.lowStockThreshold,
      },
    });

    alerts.push({ productId: product.id, inventory: product.inventory });

    if (env.ALERT_TO_EMAIL) {
      await sendEmail({
        to: env.ALERT_TO_EMAIL,
        subject: `Low stock alert: ${product.name}`,
        html: `<p>${product.name} has ${product.inventory} units left (threshold ${product.lowStockThreshold}).</p>`,
      });
    }
  }

  await db.automationLog.create({
    data: {
      type: "LOW_STOCK",
      success: true,
      message: `Low-stock sweep complete: ${alerts.length} alerts generated`,
      payload: {
        alerts,
      } as Prisma.JsonObject,
    },
  });

  return alerts;
}
