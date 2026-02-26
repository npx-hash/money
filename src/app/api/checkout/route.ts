import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderFromItems } from "@/core/order-service";
import { getStripe } from "@/core/stripe";
import { absoluteUrl } from "@/core/url";
import { createDemoOrder } from "@/core/demo-order-state";
import { resolveCartItems } from "@/products/product-service";

const payloadSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ),
  email: z.string().email().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);

    const resolvedItems = await resolveCartItems(payload);
    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: "No valid items in cart" }, { status: 400 });
    }

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: absoluteUrl("/checkout/success?session_id={CHECKOUT_SESSION_ID}"),
        cancel_url: absoluteUrl("/cart"),
        line_items: resolvedItems.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(item.salePrice * 100),
            product_data: {
              name: item.name,
              images: [item.imageUrl],
              metadata: {
                productId: item.productId,
              },
            },
          },
        })),
        metadata: {
          cart: JSON.stringify(payload.items),
        },
        customer_email: payload.email,
      });

      return NextResponse.json({ url: session.url });
    } catch {
      try {
        const simulatedOrder = await createOrderFromItems({
          email: payload.email ?? "simulated-customer@example.com",
          items: resolvedItems,
        });

        return NextResponse.json({
          url: absoluteUrl(`/checkout/success?simulated=1&order=${simulatedOrder.orderNumber}`),
        });
      } catch {
        const simulatedOrder = createDemoOrder({
          email: payload.email ?? "simulated-customer@example.com",
          items: resolvedItems,
        });

        return NextResponse.json({
          url: absoluteUrl(`/checkout/success?simulated=1&order=${simulatedOrder.orderNumber}`),
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout initialization failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
