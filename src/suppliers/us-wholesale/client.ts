import { SupplierType } from "@prisma/client";
import { getEnv } from "@/core/env";
import { SupplierOrderRequest } from "@/core/types";
import { SupplierClient } from "@/suppliers/types";

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

    return (await response.json()) as {
      accepted: boolean;
      supplierOrderId?: string;
      message?: string;
    };
  },
  async fetchTrackingUpdates(openOrders) {
    const updates = openOrders
      .filter((order) => !order.trackingNumber)
      .map((order) => ({
        orderId: order.id,
        trackingNumber: `USWTRK${order.id.slice(-8).toUpperCase()}`,
        trackingUrl: "https://tools.usps.com/go/TrackConfirmAction_input",
        status: "SHIPPED" as const,
        detail: "US warehouse handed package to carrier",
        occurredAt: new Date(),
      }));

    return { updates };
  },
};
