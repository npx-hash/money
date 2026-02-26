import { NextResponse } from "next/server";
import { listDemoProductStatus } from "@/admin/demo-state";
import { db } from "@/core/db";
import { isDatabaseConnectionError } from "@/core/db-errors";
import { listActiveProducts } from "@/products/product-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin") === "true";

  if (!admin) {
    const products = await listActiveProducts();
    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        salePrice: Number(product.salePrice),
        supplierCost: Number(product.supplierCost),
        minMarginPct: Number(product.minMarginPct),
      })),
    });
  }

  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        inventory: true,
        lowStockThreshold: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ products: listDemoProductStatus(), fallback: true });
    }

    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
