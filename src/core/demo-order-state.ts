import { OrderStatus } from "@prisma/client";
import { generateOrderNumber, roundCurrency } from "@/core/money";
import { ResolvedCartItem } from "@/core/types";

type DemoRefund = {
  id: string;
  amount: number;
  reason?: string;
  createdAt: Date;
};

type DemoOrder = {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  profit: number;
  createdAt: Date;
  refundedAt: Date | null;
  items: ResolvedCartItem[];
  refunds: DemoRefund[];
};

const demoOrders: DemoOrder[] = [];

function cloneOrder(order: DemoOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    status: order.status,
    subtotal: order.subtotal,
    total: order.total,
    profit: order.profit,
    createdAt: order.createdAt,
    refundedAt: order.refundedAt,
    items: order.items.map((item) => ({ ...item })),
    refunds: order.refunds.map((refund) => ({ ...refund })),
  };
}

export function createDemoOrder(input: {
  email: string;
  items: ResolvedCartItem[];
  status?: OrderStatus;
}) {
  if (!input.items.length) {
    throw new Error("Cannot create demo order without items");
  }

  const subtotal = roundCurrency(input.items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0));
  const totalCost = roundCurrency(input.items.reduce((sum, item) => sum + item.supplierCost * item.quantity, 0));
  const profit = roundCurrency(subtotal - totalCost);

  const order: DemoOrder = {
    id: `demo_order_${Date.now()}_${Math.floor(Math.random() * 10_000)}`,
    orderNumber: generateOrderNumber(),
    email: input.email,
    status: input.status ?? OrderStatus.PENDING,
    subtotal,
    total: subtotal,
    profit,
    createdAt: new Date(),
    refundedAt: null,
    items: input.items.map((item) => ({ ...item })),
    refunds: [],
  };

  demoOrders.unshift(order);
  return cloneOrder(order);
}

export function listDemoOrders(limit = 20) {
  return demoOrders
    .slice(0, Math.max(1, limit))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((order) => cloneOrder(order));
}

export function refundDemoOrder(input: {
  orderId: string;
  amount?: number;
  reason?: string;
}) {
  const order = demoOrders.find((entry) => entry.id === input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const amount = roundCurrency(input.amount ?? order.total);
  const refund: DemoRefund = {
    id: `demo_refund_${Date.now()}_${Math.floor(Math.random() * 10_000)}`,
    amount,
    reason: input.reason,
    createdAt: new Date(),
  };

  order.refunds.unshift(refund);
  order.status = OrderStatus.REFUNDED;
  order.refundedAt = new Date();

  return {
    order: cloneOrder(order),
    refund: { ...refund },
  };
}
