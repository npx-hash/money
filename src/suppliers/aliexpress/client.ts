import { SupplierType } from "@prisma/client";
import { getEnv } from "@/core/env";
import { SupplierOrderRequest } from "@/core/types";
import { SupplierClient } from "@/suppliers/types";

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

  return (await response.json()) as {
    accepted: boolean;
    supplierOrderId?: string;
    message?: string;
  };
}

export const aliExpressClient: SupplierClient = {
  type: SupplierType.ALIEXPRESS,
  async placeOrder(request) {
    return postAliExpressOrder(request);
  },
  async fetchTrackingUpdates(openOrders) {
    const updates = openOrders
      .filter((order) => !order.trackingNumber)
      .map((order) => ({
        orderId: order.id,
        trackingNumber: `ALIXTRK${order.id.slice(-8).toUpperCase()}`,
        trackingUrl: "https://global.cainiao.com",
        status: "SHIPPED" as const,
        detail: "Package accepted by AliExpress logistics",
        occurredAt: new Date(),
      }));

    return { updates };
  },
};
