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
      trackingNumber: `ALIXTRK${order.id.slice(-8).toUpperCase()}`,
      trackingUrl: "https://global.cainiao.com",
      status: "SHIPPED" as const,
      detail: "Package accepted by AliExpress logistics",
      occurredAt: new Date(),
    }));
}

function normalizeTrackingResponse(raw: unknown) {
  const parsed = trackingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`AliExpress tracking response validation failed: ${parsed.error.issues[0]?.message ?? "Unknown error"}`);
  }

  return {
    updates: parsed.data.updates.map((update) => {
      const occurredAt = update.occurredAt instanceof Date ? update.occurredAt : new Date(update.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        throw new Error("AliExpress tracking response contains invalid occurredAt");
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

async function postAliExpressOrder(request: SupplierOrderRequest) {
  const env = getEnv();

  if (!env.ALIEXPRESS_API_BASE_URL || !env.ALIEXPRESS_APP_KEY || !env.ALIEXPRESS_APP_SECRET) {
    return {
      accepted: true,
      supplierOrderId: `ALIX-SIM-${request.orderNumber}`,
      message: "AliExpress keys not set, simulated order created",
    };
  }

  const response = await fetch(`${env.ALIEXPRESS_API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-key": env.ALIEXPRESS_APP_KEY,
      "x-app-secret": env.ALIEXPRESS_APP_SECRET,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AliExpress order failed: ${response.status} ${body}`);
  }

  const body = await response.json().catch(() => null);
  const parsed = orderResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new Error(`AliExpress order response validation failed: ${parsed.error.issues[0]?.message ?? "Unknown error"}`);
  }

  return parsed.data;
}

async function fetchAliExpressTracking(openOrders: { id: string; trackingNumber: string | null }[]) {
  const env = getEnv();

  if (!env.ALIEXPRESS_API_BASE_URL || !env.ALIEXPRESS_APP_KEY || !env.ALIEXPRESS_APP_SECRET) {
    return {
      updates: simulatedTrackingUpdates(openOrders),
    };
  }

  const response = await fetch(`${env.ALIEXPRESS_API_BASE_URL}/tracking/updates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-key": env.ALIEXPRESS_APP_KEY,
      "x-app-secret": env.ALIEXPRESS_APP_SECRET,
    },
    body: JSON.stringify({
      orders: openOrders,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AliExpress tracking fetch failed: ${response.status} ${body}`);
  }

  const body = await response.json().catch(() => null);
  return normalizeTrackingResponse(body);
}

export const aliExpressClient: SupplierClient = {
  type: SupplierType.ALIEXPRESS,
  async placeOrder(request) {
    return postAliExpressOrder(request);
  },
  async fetchTrackingUpdates(openOrders) {
    return fetchAliExpressTracking(openOrders);
  },
};
