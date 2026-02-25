import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function GET() {
  return NextResponse.json({
    message: "POST to create manual orders, GET for health",
  });
}

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const items = await resolveCartItems(payload);

    if (!items.length) {
      return NextResponse.json({ error: "No valid items provided" }, { status: 400 });
    }

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
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
