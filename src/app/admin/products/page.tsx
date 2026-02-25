"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  isActive: boolean;
  inventory: number;
  lowStockThreshold: number;
};

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchProducts() {
    const response = await fetch("/api/products?admin=true", { cache: "no-store" });
    const body = (await response.json()) as { products?: Product[]; error?: string };
    if (!response.ok || !body.products) {
      throw new Error(body.error ?? "Failed to load products");
    }

    return body.products;
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchProducts();
        if (!cancelled) {
          setProducts(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Load failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshProducts() {
    try {
      const data = await fetchProducts();
      setProducts(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    }
  }

  async function toggleProduct(productId: string, isActive: boolean) {
    const response = await fetch(`/api/products/${productId}/kill-switch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Kill-switch update failed");
      return;
    }

    await refreshProducts();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-xl font-black text-slate-900">Product Kill-Switch</h2>
      <p className="text-sm text-slate-600">Pause any SKU instantly if margins slip or quality risks increase.</p>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="space-y-3">
        {products.map((product) => (
          <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <p className="font-bold text-slate-900">{product.name}</p>
              <p className="text-xs text-slate-500">
                Inventory: {product.inventory} | Low-stock threshold: {product.lowStockThreshold}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleProduct(product.id, !product.isActive)}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide text-white ${product.isActive ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}`}
            >
              {product.isActive ? "Disable" : "Enable"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
