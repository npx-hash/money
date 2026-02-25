"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";

type AddToCartButtonProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    salePrice: number;
  };
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() =>
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          salePrice: product.salePrice,
          quantity: 1,
        })
      }
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
      type="button"
    >
      Add to Cart
    </button>
  );
}

export function MiniCartItem({
  slug,
  imageUrl,
  name,
  quantity,
}: {
  slug: string;
  imageUrl: string;
  name: string;
  quantity: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image src={imageUrl} alt={name} width={40} height={40} className="rounded-md object-cover" />
      <div className="text-xs text-slate-700">
        <Link href={`/products/${slug}`} className="font-semibold hover:underline">
          {name}
        </Link>
        <div>Qty: {quantity}</div>
      </div>
    </div>
  );
}
