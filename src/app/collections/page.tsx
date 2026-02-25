import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { listProductsByCategory } from "@/products/product-service";

export default async function CollectionsPage() {
  const groups = await listProductsByCategory();

  return (
    <div className="page-shell space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Collections</p>
        <h1 className="text-3xl font-black text-slate-900">Low-return, fast-shipping dropship categories</h1>
        <p className="text-sm text-slate-600">
          Every listed product passes the minimum margin and non-loss filters.
        </p>
      </header>
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-800">{group.category}</h2>
              <Link href="/cart" className="text-sm font-semibold text-emerald-700 hover:underline">
                Review cart
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((product) => (
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
        ))}
      </div>
    </div>
  );
}
