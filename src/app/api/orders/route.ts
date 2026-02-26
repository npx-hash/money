import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/core/db";
import { createDemoOrder, listDemoOrders } from "@/core/demo-order-state";
import { isDatabaseConnectionError } from "@/core/db-errors";
import { createOrderFromItems } from "@/core/order-service";
import { resolveCartItems } from "@/products/product-service";

const payloadSchema = z.object({
  email: z.string().email(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 100) : 20;

  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        email: order.email,
        status: order.status,
        total: Number(order.total),
        profit: Number(order.profit),
        createdAt: order.createdAt,
        refundedAt: order.refundedAt,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          lineTotal: Number(item.unitPrice) * item.quantity,
        })),
      })),
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({
        orders: listDemoOrders(limit).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          email: order.email,
          status: order.status,
          total: order.total,
          profit: order.profit,
          createdAt: order.createdAt,
          refundedAt: order.refundedAt,
          items: order.items.map((item) => ({
            productName: item.name,
            quantity: item.quantity,
            lineTotal: item.salePrice * item.quantity,
          })),
        })),
        fallback: true,
      });
    }

    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const items = await resolveCartItems(payload);

    if (!items.length) {
      return NextResponse.json({ error: "No valid items provided" }, { status: 400 });
    }

    try {
      const order = await createOrderFromItems({
        email: payload.email,
        items,
      });

      return NextResponse.json({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
      });
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      const order = createDemoOrder({
        email: payload.email,
        items,
      });

      return NextResponse.json({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
        fallback: true,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
