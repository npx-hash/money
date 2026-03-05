import { SupplierType } from "@prisma/client";
import { z } from "zod";
import { getEnv } from "@/core/env";
import { SupplierOrderRequest } from "@/core/types";
import { SupplierClient } from "@/suppliers/types";

const orderResponseSchema = z.object({
  accepted: z.boolean(),
  supplierOrderId: z.string().optional(),
  message: z.string().optional(),
});

const trackingResponseSchema = z.object({
  updates: z.array(
    z.object({
      orderId: z.string().min(1),
      trackingNumber: z.string().min(1),
      trackingUrl: z.string().min(1).optional(),
      status: z.enum(["SHIPPED", "DELIVERED"]),
      detail: z.string().min(1),
      occurredAt: z.union([z.date(), z.string().min(1)]),
    }),
  ),
});

function simulatedTrackingUpdates(openOrders: { id: string; trackingNumber: string | null }[]) {
  return openOrders
    .filter((order) => !order.trackingNumber)
    .map((order) => ({
      orderId: order.id,
      trackingNumber: `USWTRK${order.id.slice(-8).toUpperCase()}`,
      trackingUrl: "https://tools.usps.com/go/TrackConfirmAction_input",
      status: "SHIPPED" as const,
      detail: "US warehouse handed package to carrier",
      occurredAt: new Date(),
    }));
}

function normalizeTrackingResponse(raw: unknown) {
  const parsed = trackingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`US wholesaler tracking response validation failed: ${parsed.error.issues[0]?.message ?? "Unknown error"}`);
  }

  return {
    updates: parsed.data.updates.map((update) => {
      const occurredAt = update.occurredAt instanceof Date ? update.occurredAt : new Date(update.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        throw new Error("US wholesaler tracking response contains invalid occurredAt");
      }

      return {
        orderId: update.orderId,
        trackingNumber: update.trackingNumber,
        trackingUrl: update.trackingUrl,
        status: update.status,
        detail: update.detail,
        occurredAt,
      };
    }),
  };
}

export const usWholesaleClient: SupplierClient = {
  type: SupplierType.US_WHOLESALER,
  async placeOrder(request: SupplierOrderRequest) {
    const env = getEnv();

    if (!env.US_WHOLESALER_API_BASE_URL || !env.US_WHOLESALER_API_KEY) {
      return {
        accepted: true,
        supplierOrderId: `USW-SIM-${request.orderNumber}`,
        message: "US wholesaler API key not set, simulated order created",
      };
    }

    const response = await fetch(`${env.US_WHOLESALER_API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.US_WHOLESALER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`US wholesaler order failed: ${response.status} ${body}`);
    }

    const body = await response.json().catch(() => null);
    const parsed = orderResponseSchema.safeParse(body);

    if (!parsed.success) {
      throw new Error(`US wholesaler order response validation failed: ${parsed.error.issues[0]?.message ?? "Unknown error"}`);
    }

    return parsed.data;
  },
  async fetchTrackingUpdates(openOrders) {
    const env = getEnv();

    if (!env.US_WHOLESALER_API_BASE_URL || !env.US_WHOLESALER_API_KEY) {
      return {
        updates: simulatedTrackingUpdates(openOrders),
      };
    }

    const response = await fetch(`${env.US_WHOLESALER_API_BASE_URL}/tracking/updates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.US_WHOLESALER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orders: openOrders,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`US wholesaler tracking fetch failed: ${response.status} ${body}`);
    }

    const body = await response.json().catch(() => null);
    return normalizeTrackingResponse(body);
  },
};
