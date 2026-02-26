import { NextResponse } from "next/server";
import { z } from "zod";
import { refundDemoOrder } from "@/core/demo-order-state";
import { isDatabaseConnectionError } from "@/core/db-errors";
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
  let id: string;
  let payload: z.infer<typeof refundSchema>;

  try {
    id = (await params).id;
    payload = refundSchema.parse(await request.json().catch(() => ({})));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid refund payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
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
    if (isDatabaseConnectionError(error)) {
      try {
        const result = refundDemoOrder({
          orderId: id,
          amount: payload.amount,
          reason: payload.reason,
        });

        return NextResponse.json({
          order: {
            id: result.order.id,
            status: result.order.status,
          },
          fallback: true,
        });
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Refund failed";
        return NextResponse.json({ error: fallbackMessage }, { status: 400 });
      }
    }

    const message = error instanceof Error ? error.message : "Refund failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
