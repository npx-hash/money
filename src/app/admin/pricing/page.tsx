"use client";

import { useEffect, useState } from "react";

type PricingProduct = {
  id: string;
  name: string;
  salePrice: number;
  supplierCost: number;
  minMarginPct: number;
  autoPriceTest: boolean;
};

export default function PricingPage() {
  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchPricingProducts() {
    const response = await fetch("/api/pricing", { cache: "no-store" });
    const body = (await response.json()) as { products?: PricingProduct[]; error?: string };

    if (!response.ok || !body.products) {
      throw new Error(body.error ?? "Failed to load pricing");
    }

    return body.products;
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchPricingProducts();
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
      const data = await fetchPricingProducts();
      setProducts(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    }
  }

  async function savePrice(product: PricingProduct) {
    const response = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        salePrice: product.salePrice,
        autoPriceTest: product.autoPriceTest,
      }),
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(body.error ?? "Price update failed");
      return;
    }

    await refreshProducts();
  }

  async function runExperiment(productId: string) {
    const response = await fetch("/api/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Experiment creation failed");
      return;
    }

    setError(null);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-xl font-black text-slate-900">Price Controls</h2>
      <p className="text-sm text-slate-600">30%+ margin is enforced on every price update.</p>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="space-y-3">
        {products.map((product) => (
          <article key={product.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto_auto] lg:items-center">
            <p className="font-bold text-slate-900">{product.name}</p>
            <label className="text-sm">
              Cost
              <input
                readOnly
                value={product.supplierCost.toFixed(2)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-slate-600"
              />
            </label>
            <label className="text-sm">
              Sale price
              <input
                type="number"
                min={1}
                step={0.01}
                value={product.salePrice}
                onChange={(event) => {
                  const value = Number(event.currentTarget.value);
                  setProducts((current) =>
                    current.map((entry) => (entry.id === product.id ? { ...entry, salePrice: value } : entry)),
                  );
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={product.autoPriceTest}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setProducts((current) =>
                    current.map((entry) =>
                      entry.id === product.id
                        ? {
                            ...entry,
                            autoPriceTest: checked,
                          }
                        : entry,
                    ),
                  );
                }}
              />
              Auto test
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => savePrice(product)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-slate-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => runExperiment(product.id)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-500"
              >
                Test
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
