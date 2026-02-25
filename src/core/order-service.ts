import { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { sendEmail } from "@/core/email";
import { generateOrderNumber, roundCurrency } from "@/core/money";
import { ResolvedCartItem } from "@/core/types";
import { routeOrderToSupplier } from "@/suppliers/router";

export async function createOrderFromItems(input: {
  email: string;
  items: ResolvedCartItem[];
  stripeSessionId?: string;
  customerName?: string | null;
  addressJson?: unknown;
}) {
  if (input.items.length === 0) {
    throw new Error("Cannot create order without items");
  }

  const subtotal = roundCurrency(input.items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0));
  const totalCost = roundCurrency(input.items.reduce((sum, item) => sum + item.supplierCost * item.quantity, 0));
  const profit = roundCurrency(subtotal - totalCost);

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        stripeSessionId: input.stripeSessionId,
        email: input.email,
        customerName: input.customerName,
        addressJson: (input.addressJson ?? undefined) as Prisma.InputJsonValue | undefined,
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        profit: new Prisma.Decimal(profit),
        status: OrderStatus.PENDING,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.supplierCost),
            unitPrice: new Prisma.Decimal(item.salePrice),
            lineProfit: new Prisma.Decimal(roundCurrency((item.salePrice - item.supplierCost) * item.quantity)),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });
    }

    return created;
  });

  try {
    await routeOrderToSupplier(order.id);
  } catch (routingError) {
    await db.automationLog.create({
      data: {
        type: "SUPPLIER_ORDER",
        success: false,
        message: routingError instanceof Error ? routingError.message : "Supplier routing failed",
        payload: { orderId: order.id },
      },
    });
  }

  await sendEmail({
    to: input.email,
    subject: `Order ${order.orderNumber} received`,
    html: `<p>Thanks for your order.</p><p>Order ID: <strong>${order.orderNumber}</strong></p>`,
  });

  return order;
}

export async function applyRefund(input: {
  orderId: string;
  amount: number;
  reason?: string;
  stripeRefundId?: string;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!order) {
      throw new Error("Order not found");
    }

    await tx.refund.create({
      data: {
        orderId: order.id,
        amount: new Prisma.Decimal(input.amount),
        reason: input.reason,
        stripeRefundId: input.stripeRefundId,
      },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    await tx.automationLog.create({
      data: {
        type: "REFUND",
        success: true,
        message: "Refund recorded",
        payload: {
          orderId: order.id,
          amount: input.amount,
          reason: input.reason,
        },
      },
    });

    return updated;
  });
}
