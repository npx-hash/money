import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { listActiveProducts } from "@/products/product-service";

export default async function Home() {
  const products = await listActiveProducts();

  return (
    <div className="page-shell space-y-10">
      <section className="reveal grid gap-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
            Brokered Dropshipping MVP
          </p>
          <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            Launch in 14 days with guarded margins and supplier automation.
          </h1>
          <p className="max-w-xl text-base text-slate-600">
            MarginMint routes paid orders to suppliers, syncs tracking, and blocks low-margin products before they lose
            money.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/collections"
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Shop Collection
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Open Admin
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Unit Economics Guardrails</h2>
          <ul className="space-y-2">
            <li>Min margin floor: 30% enforced at checkout/admin updates</li>
            <li>Loss products are blocked from checkout</li>
            <li>Auto price testing enabled with safe variants only</li>
            <li>Supplier routing prefers in-stock + preferred sources</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-slate-900">Winning Product Starters</h2>
          <Link href="/collections" className="text-sm font-semibold text-emerald-700 hover:underline">
            View all categories
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                salePrice: Number(product.salePrice),
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
