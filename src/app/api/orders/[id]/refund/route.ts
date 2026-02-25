import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRefund } from "@/core/order-service";
import { getStripe } from "@/core/stripe";
import { db } from "@/core/db";

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(2).optional(),
});

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = refundSchema.parse(await request.json().catch(() => ({})));

    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const amount = payload.amount ?? Number(order.total);
    let stripeRefundId: string | undefined;

    if (order.stripeSessionId) {
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
          expand: ["payment_intent"],
        });

        const paymentIntent = session.payment_intent;
        const paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;

        if (paymentIntentId) {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(amount * 100),
            reason: "requested_by_customer",
            metadata: {
              orderId: order.id,
            },
          });
          stripeRefundId = refund.id;
        }
      } catch (stripeError) {
        console.error("Stripe refund failed, continuing local refund record", stripeError);
      }
    }

    const updated = await applyRefund({
      orderId: order.id,
      amount,
      reason: payload.reason,
      stripeRefundId,
    });

    return NextResponse.json({
      order: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refund failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
