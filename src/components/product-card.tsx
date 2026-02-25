import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    salePrice: number;
    shippingDays: number;
    category: string;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {product.category}
          </span>
          <span className="text-xs text-slate-500">Ships in {product.shippingDays}d</span>
        </div>
        <Link href={`/products/${product.slug}`} className="text-base font-bold text-slate-900 hover:underline">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <p className="text-lg font-extrabold text-slate-900">${product.salePrice.toFixed(2)}</p>
          <AddToCartButton
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageUrl,
              salePrice: product.salePrice,
            }}
          />
        </div>
      </div>
    </article>
  );
}
