"use client";

import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import { useCart } from "@/components/cart-provider";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  return (
    <div className="page-shell space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Your Cart</h1>
        <p className="text-sm text-slate-600">Review products before checkout.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Cart is empty. <Link href="/collections" className="font-semibold text-emerald-700 hover:underline">Browse collections</Link>.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            {items.map((item) => (
              <article key={item.productId} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <h2 className="font-bold text-slate-900">{item.name}</h2>
                  <p className="text-sm text-slate-600">${item.salePrice.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-md border border-slate-300 text-slate-700"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-md border border-slate-300 text-slate-700"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">${(item.salePrice * item.quantity).toFixed(2)}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-700 hover:underline"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Shipping</span>
              <span className="font-bold text-slate-900">$0.00</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="text-xl font-black text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
            </div>
            <CheckoutButton />
          </aside>
        </div>
      )}
    </div>
  );
}
