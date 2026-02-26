"use client";

import { useState } from "react";

type ActionResult = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  payload?: unknown;
};

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function AutomationAdminPage() {
  const [tracking, setTracking] = useState<ActionResult>({ status: "idle" });
  const [lowStock, setLowStock] = useState<ActionResult>({ status: "idle" });

  async function runTrackingSync() {
    setTracking({ status: "loading" });

    try {
      const response = await fetch("/api/automation/tracking-sync", {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string; fallback?: boolean } & Record<string, unknown>;

      if (!response.ok) {
        throw new Error(body.error ?? "Tracking sync failed");
      }

      setTracking({
        status: "success",
        message: body.fallback ? "Tracking sync ran in demo mode." : "Tracking sync complete.",
        payload: body,
      });
    } catch (error) {
      setTracking({
        status: "error",
        message: error instanceof Error ? error.message : "Tracking sync failed",
      });
    }
  }

  async function runLowStockSweep() {
    setLowStock({ status: "loading" });

    try {
      const response = await fetch("/api/automation/low-stock", {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string; fallback?: boolean } & Record<string, unknown>;

      if (!response.ok) {
        throw new Error(body.error ?? "Low-stock sweep failed");
      }

      setLowStock({
        status: "success",
        message: body.fallback ? "Low-stock sweep ran in demo mode." : "Low-stock sweep complete.",
        payload: body,
      });
    } catch (error) {
      setLowStock({
        status: "error",
        message: error instanceof Error ? error.message : "Low-stock sweep failed",
      });
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-black text-slate-900">Automation Controls</h2>
        <p className="mt-1 text-sm text-slate-600">
          Run operational workflows directly from admin and inspect structured responses.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-900">Tracking Sync</h3>
          <p className="text-sm text-slate-600">Pull latest supplier tracking updates and send customer emails.</p>
          <button
            type="button"
            onClick={runTrackingSync}
            disabled={tracking.status === "loading"}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {tracking.status === "loading" ? "Running..." : "Run Tracking Sync"}
          </button>
          {tracking.message ? (
            <p className={`text-sm font-semibold ${tracking.status === "error" ? "text-rose-700" : "text-emerald-700"}`}>
              {tracking.message}
            </p>
          ) : null}
          {tracking.payload ? (
            <pre className="overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{pretty(tracking.payload)}</pre>
          ) : null}
        </article>

        <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-900">Low-Stock Sweep</h3>
          <p className="text-sm text-slate-600">Generate low-stock alerts and optionally notify your alert inbox.</p>
          <button
            type="button"
            onClick={runLowStockSweep}
            disabled={lowStock.status === "loading"}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {lowStock.status === "loading" ? "Running..." : "Run Low-Stock Sweep"}
          </button>
          {lowStock.message ? (
            <p className={`text-sm font-semibold ${lowStock.status === "error" ? "text-rose-700" : "text-emerald-700"}`}>
              {lowStock.message}
            </p>
          ) : null}
          {lowStock.payload ? (
            <pre className="overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{pretty(lowStock.payload)}</pre>
          ) : null}
        </article>
      </section>
    </div>
  );
}
