import { SupplierType } from "@prisma/client";
import { SupplierOrderRequest, SupplierTrackingUpdate } from "@/core/types";

export type SupplierOrderResponse = {
  accepted: boolean;
  supplierOrderId?: string;
  message?: string;
};

export type SupplierTrackingResponse = {
  updates: SupplierTrackingUpdate[];
};

export interface SupplierClient {
  type: SupplierType;
  placeOrder: (request: SupplierOrderRequest) => Promise<SupplierOrderResponse>;
  fetchTrackingUpdates: (openOrders: { id: string; trackingNumber: string | null }[]) => Promise<SupplierTrackingResponse>;
}
