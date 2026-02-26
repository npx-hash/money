"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  contactEmail: string | null;
  averageLeadDays: number;
  shippingMaxDays: number;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  async function fetchSuppliersData() {
    const response = await fetch("/api/suppliers", { cache: "no-store" });
    const body = (await response.json()) as { suppliers?: Supplier[]; error?: string; fallback?: boolean };

    if (!response.ok || !body.suppliers) {
      throw new Error(body.error ?? "Failed to load suppliers");
    }

    return { suppliers: body.suppliers, fallback: Boolean(body.fallback) };
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchSuppliersData();
        if (!cancelled) {
          setSuppliers(data.suppliers);
          setDemoMode(data.fallback);
          setError(null);
          setNotice(null);
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

  async function refreshSuppliers() {
    setLoading(true);
    try {
      const data = await fetchSuppliersData();
      setSuppliers(data.suppliers);
      setDemoMode(data.fallback);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function updateSupplier(id: string, patch: Partial<Supplier>) {
    const response = await fetch("/api/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Failed to update supplier");
      return;
    }

    setNotice("Supplier updated.");
    setError(null);
    await refreshSuppliers();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading suppliers...</p>;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-xl font-black text-slate-900">Supplier Editor</h2>
      {demoMode ? <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Demo mode: in-memory data</p> : null}
      {notice ? <p className="text-sm font-semibold text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            No suppliers found.
          </p>
        ) : null}
        {suppliers.map((supplier) => (
          <article key={supplier.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
            <div>
              <p className="font-bold text-slate-900">{supplier.name}</p>
              <p className="text-xs text-slate-500">{supplier.code} | {supplier.type}</p>
            </div>
            <label className="text-sm">
              Lead days
              <input
                type="number"
                min={1}
                value={supplier.averageLeadDays}
                onChange={(event) => {
                  const value = Number(event.currentTarget.value);
                  setSuppliers((current) =>
                    current.map((entry) =>
                      entry.id === supplier.id
                        ? {
                            ...entry,
                            averageLeadDays: value,
                          }
                        : entry,
                    ),
                  );
                }}
                onBlur={() => updateSupplier(supplier.id, { averageLeadDays: supplier.averageLeadDays })}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <label className="text-sm">
              Shipping max days
              <input
                type="number"
                min={2}
                value={supplier.shippingMaxDays}
                onChange={(event) => {
                  const value = Number(event.currentTarget.value);
                  setSuppliers((current) =>
                    current.map((entry) =>
                      entry.id === supplier.id
                        ? {
                            ...entry,
                            shippingMaxDays: value,
                          }
                        : entry,
                    ),
                  );
                }}
                onBlur={() => updateSupplier(supplier.id, { shippingMaxDays: supplier.shippingMaxDays })}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <button
              type="button"
              onClick={() => updateSupplier(supplier.id, { isActive: !supplier.isActive })}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide ${supplier.isActive ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"}`}
            >
              {supplier.isActive ? "Active" : "Paused"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
