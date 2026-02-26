"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const [simulated, setSimulated] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    clearCart();

    const params = new URLSearchParams(window.location.search);
    setSimulated(params.get("simulated") === "1");
    setOrderNumber(params.get("order"));
  }, [clearCart]);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          {simulated ? "Simulation Complete" : "Payment Received"}
        </p>
        <h1 className="text-3xl font-black text-slate-900">
          {simulated ? "Checkout completed in demo mode" : "Order placed successfully"}
        </h1>
        <p className="text-slate-600">
          Your order has been captured and is being routed to the supplier. Tracking updates will be emailed once available.
        </p>
        {orderNumber ? (
          <p className="text-sm font-semibold text-slate-700">
            Order reference: <span className="font-black">{orderNumber}</span>
          </p>
        ) : null}
        <Link href="/collections" className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
