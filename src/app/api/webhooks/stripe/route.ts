import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/core/db";
import { getEnv } from "@/core/env";
import { applyRefund, createOrderFromItems } from "@/core/order-service";
import { getStripe } from "@/core/stripe";
import { resolveCartItems } from "@/products/product-service";

const cartSchema = z.array(
  z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  }),
);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const env = getEnv();
    if (!env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 500 });
    }

    const stripe = getStripe();
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const existing = await db.order.findUnique({
          where: {
            stripeSessionId: session.id,
          },
        });

        if (existing) {
          break;
        }

        const rawCart = session.metadata?.cart;
        const parsedCart = rawCart ? cartSchema.parse(JSON.parse(rawCart)) : [];
        const items = await resolveCartItems({
          items: parsedCart,
          email: session.customer_email ?? undefined,
        });

        if (!items.length) {
          throw new Error("Session completed but no valid cart items resolved");
        }

        await createOrderFromItems({
          stripeSessionId: session.id,
          email: session.customer_details?.email ?? session.customer_email ?? "customer@unknown.local",
          customerName: session.customer_details?.name,
          addressJson: session.customer_details?.address,
          items,
        });

        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.orderId;

        if (orderId) {
          await applyRefund({
            orderId,
            amount: charge.amount_refunded / 100,
            reason: "Stripe charge.refunded webhook",
            stripeRefundId: charge.refunds?.data[0]?.id,
          });
        }

        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
