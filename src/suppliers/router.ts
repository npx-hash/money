import { OrderStatus, Prisma, SupplierType } from "@prisma/client";
import { db } from "@/core/db";
import { sendEmail } from "@/core/email";
import { SupplierOrderRequest } from "@/core/types";
import { aliExpressClient } from "@/suppliers/aliexpress/client";
import { SupplierClient } from "@/suppliers/types";
import { usWholesaleClient } from "@/suppliers/us-wholesale/client";

const clientsByType = new Map<SupplierType, SupplierClient>([
  [SupplierType.ALIEXPRESS, aliExpressClient],
  [SupplierType.US_WHOLESALER, usWholesaleClient],
]);

function getSupplierClient(type: SupplierType): SupplierClient {
  const client = clientsByType.get(type);
  if (!client) {
    throw new Error(`No supplier client for type ${type}`);
  }

  return client;
}

function toSupplierOrderItems(items: {
  quantity: number;
  product: {
    supplierProducts: {
      supplierId: string;
      supplierSku: string;
      stock: number;
      isPreferred: boolean;
    }[];
  };
}[]) {
  if (!items.length) {
    throw new Error("Order has no items");
  }

  const candidateIds = new Set(
    items[0].product.supplierProducts.filter((entry) => entry.stock >= items[0].quantity).map((entry) => entry.supplierId),
  );

  for (const item of items.slice(1)) {
    const eligibleIds = new Set(
      item.product.supplierProducts.filter((entry) => entry.stock >= item.quantity).map((entry) => entry.supplierId),
    );

    for (const candidateId of candidateIds) {
      if (!eligibleIds.has(candidateId)) {
        candidateIds.delete(candidateId);
      }
    }
  }

  if (!candidateIds.size) {
    throw new Error("No single supplier can fulfill all order items with current stock");
  }

  const ranked = Array.from(candidateIds).map((supplierId) => {
    const supplierItems = items.map((item) => {
      const supplierEntry = item.product.supplierProducts.find(
        (entry) => entry.supplierId === supplierId && entry.stock >= item.quantity,
      );

      if (!supplierEntry) {
        throw new Error("Insufficient supplier stock for one or more items");
      }

      return {
        supplierSku: supplierEntry.supplierSku,
        quantity: item.quantity,
        isPreferred: supplierEntry.isPreferred,
        stock: supplierEntry.stock,
      };
    });

    return {
      supplierId,
      items: supplierItems.map((line) => ({
        supplierSku: line.supplierSku,
        quantity: line.quantity,
      })),
      preferredCount: supplierItems.filter((line) => line.isPreferred).length,
      totalStock: supplierItems.reduce((total, line) => total + line.stock, 0),
    };
  });

  ranked.sort((a, b) => {
    if (b.preferredCount !== a.preferredCount) {
      return b.preferredCount - a.preferredCount;
    }

    return b.totalStock - a.totalStock;
  });

  const [selected] = ranked;
  if (!selected) {
    throw new Error("Unable to select supplier");
  }

  return selected;
}

export async function routeOrderToSupplier(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              supplierProducts: {
                where: {
                  supplier: {
                    isActive: true,
                  },
                },
                include: {
                  supplier: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const { supplierId: selectedSupplierId, items: selectedItems } = toSupplierOrderItems(order.items);

  const supplier = order.items
    .flatMap((item) => item.product.supplierProducts)
    .find((entry) => entry.supplierId === selectedSupplierId)?.supplier;

  if (!supplier) {
    throw new Error("Selected supplier not found on order items");
  }

  const client = getSupplierClient(supplier.type);

  const request: SupplierOrderRequest = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    addressJson: order.addressJson,
    items: selectedItems,
  };

  const supplierResponse = await client.placeOrder(request);

  if (!supplierResponse.accepted) {
    throw new Error(supplierResponse.message ?? "Supplier rejected order");
  }

  if (supplier.contactEmail) {
    await sendEmail({
      to: supplier.contactEmail,
      subject: `New brokered order ${order.orderNumber}`,
      html: `<p>Order ${order.orderNumber} routed to supplier.</p><p>Items: ${selectedItems
        .map((item) => `${item.supplierSku} x${item.quantity}`)
        .join(", ")}</p>`,
    });
  }

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        supplierId: supplier.id,
        status: OrderStatus.ROUTED,
        routedAt: new Date(),
      },
    });

    await tx.automationLog.create({
      data: {
        type: "SUPPLIER_ORDER",
        success: true,
        message: supplierResponse.message ?? "Order routed to supplier",
        payload: {
          orderId: order.id,
          supplierId: supplier.id,
          supplierOrderId: supplierResponse.supplierOrderId,
        } as Prisma.JsonObject,
      },
    });

    return updated;
  });

  return result;
}

export async function syncTrackingForOpenOrders() {
  const openOrders = await db.order.findMany({
    where: {
      status: {
        in: [OrderStatus.ROUTED, OrderStatus.SHIPPED],
      },
      supplier: {
        isActive: true,
      },
    },
    select: {
      id: true,
      status: true,
      trackingNumber: true,
      supplier: {
        select: {
          type: true,
        },
      },
    },
    take: 100,
  });

  const grouped = new Map<SupplierType, { id: string; trackingNumber: string | null }[]>();

  for (const order of openOrders) {
    if (!order.supplier) {
      continue;
    }

    const existing = grouped.get(order.supplier.type) ?? [];
    existing.push({ id: order.id, trackingNumber: order.trackingNumber });
    grouped.set(order.supplier.type, existing);
  }

  const allowedOrderIds = new Set(openOrders.map((order) => order.id));
  const updatesByOrderId = new Map<
    string,
    {
      orderId: string;
      trackingNumber: string;
      trackingUrl?: string;
      status: "SHIPPED" | "DELIVERED";
      detail: string;
      occurredAt: Date;
    }
  >();

  for (const [supplierType, orders] of grouped.entries()) {
    const client = getSupplierClient(supplierType);
    const response = await client.fetchTrackingUpdates(orders);

    for (const update of response.updates) {
      if (!allowedOrderIds.has(update.orderId)) {
        continue;
      }

      const existing = updatesByOrderId.get(update.orderId);
      if (!existing) {
        updatesByOrderId.set(update.orderId, update);
        continue;
      }

      if (update.status === "DELIVERED" && existing.status !== "DELIVERED") {
        updatesByOrderId.set(update.orderId, update);
        continue;
      }

      if (update.occurredAt > existing.occurredAt) {
        updatesByOrderId.set(update.orderId, update);
      }
    }
  }

  const updates = Array.from(updatesByOrderId.values()) as {
    orderId: string;
    trackingNumber: string;
    trackingUrl?: string;
    status: "SHIPPED" | "DELIVERED";
    detail: string;
    occurredAt: Date;
  }[];

  for (const update of updates) {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: update.orderId },
        data: {
          status: update.status,
          trackingNumber: update.trackingNumber,
          trackingUrl: update.trackingUrl,
          shippedAt: update.status === "SHIPPED" ? update.occurredAt : undefined,
        },
      });

      await tx.trackingEvent.create({
        data: {
          orderId: update.orderId,
          status: update.status,
          detail: update.detail,
          occurredAt: update.occurredAt,
        },
      });
    });
  }

  await db.automationLog.create({
    data: {
      type: "TRACKING_SYNC",
      success: true,
      message: `Tracking sync complete: ${updates.length} updates`,
      payload: {
        openOrders: openOrders.length,
        supplierGroups: grouped.size,
        updatedOrderIds: updates.map((update) => update.orderId),
      } as Prisma.JsonObject,
    },
  });

  return updates;
}
