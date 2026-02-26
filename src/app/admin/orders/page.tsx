"use client";

import { useEffect, useState } from "react";

type OrderListItem = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  total: number;
  profit: number;
  createdAt: string;
  refundedAt: string | null;
  items: {
    productName: string;
    quantity: number;
    lineTotal: number;
  }[];
};

type OrdersResponse = {
  orders?: OrderListItem[];
  fallback?: boolean;
  error?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [activeRefundOrderId, setActiveRefundOrderId] = useState<string | null>(null);

  async function fetchOrders() {
    const response = await fetch("/api/orders?limit=30", { cache: "no-store" });
    const body = (await response.json()) as OrdersResponse;
    if (!response.ok || !body.orders) {
      throw new Error(body.error ?? "Failed to load orders");
    }

    return {
      orders: body.orders,
      fallback: Boolean(body.fallback),
    };
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchOrders();
        if (!cancelled) {
          setOrders(data.orders);
          setDemoMode(data.fallback);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Load failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshOrders() {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data.orders);
      setDemoMode(data.fallback);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function refundOrder(orderId: string) {
    setActiveRefundOrderId(orderId);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Refund failed");
      }

      setNotice("Refund recorded.");
      await refreshOrders();
    } catch (refundError) {
      setError(refundError instanceof Error ? refundError.message : "Refund failed");
    } finally {
      setActiveRefundOrderId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-900">Order Operations</h2>
        <button
          type="button"
          onClick={refreshOrders}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {demoMode ? <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Demo mode: in-memory data</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading orders...</p> : null}
      {notice ? <p className="text-sm font-semibold text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="space-y-3">
        {!loading && orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            No orders yet. Complete checkout from the storefront to populate this feed.
          </p>
        ) : null}

        {orders.map((order) => {
          const refundDisabled = order.status === "REFUNDED" || order.status === "CANCELED";

          return (
            <article key={order.id} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{order.orderNumber}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{order.status}</p>
              </div>

              <p className="text-sm text-slate-600">{order.email}</p>
              <p className="text-xs text-slate-500">Placed: {formatDate(order.createdAt)}</p>
              <p className="text-sm text-slate-700">
                Total: ${order.total.toFixed(2)} | Profit: ${order.profit.toFixed(2)}
              </p>

              <div className="text-xs text-slate-600">
                {order.items.map((item, index) => (
                  <p key={`${order.id}_${index}`}>
                    {item.productName} x{item.quantity} (${item.lineTotal.toFixed(2)})
                  </p>
                ))}
              </div>

              <button
                type="button"
                disabled={refundDisabled || activeRefundOrderId === order.id}
                onClick={() => refundOrder(order.id)}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {order.status === "REFUNDED"
                  ? "Refunded"
                  : activeRefundOrderId === order.id
                    ? "Processing..."
                    : "Refund"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
