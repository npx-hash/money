import Link from "next/link";
import { listExtensions } from "@/ai/extension-registry";
import { getRecentOrders, getProfitSnapshot } from "@/finance/profit-service";
import { firstSaleChecklist } from "@/marketing/playbook";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [snapshot, recentOrders] = await Promise.all([getProfitSnapshot(30), getRecentOrders(8)]);
  const extensions = listExtensions();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Orders (30d)" value={snapshot.orderCount.toString()} />
        <MetricCard label="Revenue" value={`$${snapshot.grossRevenue.toFixed(2)}`} />
        <MetricCard label="Profit" value={`$${snapshot.grossProfit.toFixed(2)}`} />
        <MetricCard label="Avg Profit/Order" value={`$${snapshot.avgProfit.toFixed(2)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <span className="text-xs font-semibold text-slate-500">Live</span>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{order.status}</p>
                  </div>
                  <p className="text-slate-600">{order.email}</p>
                  <p className="text-slate-700">Total: ${Number(order.total).toFixed(2)} | Profit: ${Number(order.profit).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-bold text-slate-900">AI Extension Readiness</h2>
          <ul className="space-y-2 text-sm">
            {extensions.map((extension) => (
              <li key={extension.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="font-semibold text-slate-900">{extension.id}</p>
                <p className="text-slate-600">{extension.description}</p>
                <p className="text-xs font-semibold text-emerald-700">Trigger: {extension.trigger}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">First Sale Actions</h2>
          <Link href="/collections" className="text-sm font-semibold text-emerald-700 hover:underline">
            Open Storefront
          </Link>
        </div>
        <ul className="space-y-2 text-sm">
          {firstSaleChecklist.map((item) => (
            <li key={item.channel} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p className="font-semibold text-slate-900">{item.channel}</p>
              <p className="text-slate-600">{item.action}</p>
              <p className="text-xs text-slate-500">Budget: ${item.budgetUsd}/day</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </article>
  );
}
