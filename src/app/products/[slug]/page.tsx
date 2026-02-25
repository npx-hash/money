import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getProductBySlug } from "@/products/product-service";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const margin = Number(product.salePrice) - Number(product.supplierCost);

  return (
    <div className="page-shell">
      <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-8">
        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
        </div>
        <div className="space-y-5">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{product.category}</p>
          <h1 className="text-3xl font-black text-slate-900">{product.name}</h1>
          <p className="text-base text-slate-600">{product.description}</p>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="text-slate-500">Price</p>
              <p className="text-xl font-bold text-slate-900">${Number(product.salePrice).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500">Estimated Shipping</p>
              <p className="text-xl font-bold text-slate-900">{product.shippingDays} days</p>
            </div>
            <div>
              <p className="text-slate-500">Return Risk</p>
              <p className="font-bold text-slate-900">{product.returnRisk}</p>
            </div>
            <div>
              <p className="text-slate-500">Expected Unit Profit</p>
              <p className="font-bold text-emerald-700">${margin.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl,
                salePrice: Number(product.salePrice),
              }}
            />
            <Link href="/cart" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Go to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
