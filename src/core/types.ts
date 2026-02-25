export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CheckoutPayload = {
  items: CartItemInput[];
  email?: string;
};

export type ResolvedCartItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  quantity: number;
  salePrice: number;
  supplierCost: number;
};

export type SupplierOrderItem = {
  supplierSku: string;
  quantity: number;
};

export type SupplierOrderRequest = {
  orderId: string;
  orderNumber: string;
  customerName?: string | null;
  email: string;
  addressJson?: unknown;
  items: SupplierOrderItem[];
};

export type SupplierTrackingUpdate = {
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: "SHIPPED" | "DELIVERED";
  detail: string;
  occurredAt: Date;
};
