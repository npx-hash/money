import { db } from "@/core/db";
import { CheckoutPayload, ResolvedCartItem } from "@/core/types";
import { demoCatalog } from "@/products/demo-catalog";
import { evaluateMargin } from "@/products/pricing-engine";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  salePrice: number;
  supplierCost: number;
  minMarginPct: number;
  shippingDays: number;
  isActive: boolean;
  returnRisk: string;
};

export type ProductDetail = StoreProduct & {
  autoPriceTest: boolean;
  experiments: {
    id: string;
    variant: string;
    testPrice: number;
    isActive: boolean;
  }[];
  supplierProducts: {
    id: string;
    supplierId: string;
    supplierSku: string;
    stock: number;
    isPreferred: boolean;
  }[];
};

function toStoreProduct(product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  salePrice: number | { toString(): string };
  supplierCost: number | { toString(): string };
  minMarginPct: number | { toString(): string };
  shippingDays: number;
  isActive: boolean;
  returnRisk: string;
}): StoreProduct {
  return {
    ...product,
    salePrice: Number(product.salePrice),
    supplierCost: Number(product.supplierCost),
    minMarginPct: Number(product.minMarginPct),
  };
}

function passesMargin(product: Pick<StoreProduct, "salePrice" | "supplierCost" | "minMarginPct" | "isActive">) {
  if (!product.isActive) {
    return false;
  }

  const margin = evaluateMargin({
    salePrice: product.salePrice,
    supplierCost: product.supplierCost,
    minMarginPct: product.minMarginPct,
  });

  return margin.valid;
}

function demoProducts(): StoreProduct[] {
  return demoCatalog.map((product) => toStoreProduct(product)).filter((product) => passesMargin(product));
}

export async function listActiveProducts(): Promise<StoreProduct[]> {
  if (!process.env.DATABASE_URL) {
    return demoProducts();
  }

  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        imageUrl: true,
        salePrice: true,
        supplierCost: true,
        minMarginPct: true,
        shippingDays: true,
        isActive: true,
        returnRisk: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => toStoreProduct(product)).filter((product) => passesMargin(product));
  } catch {
    return demoProducts();
  }
}

export async function listProductsByCategory() {
  const products = await listActiveProducts();
  const grouped = new Map<string, StoreProduct[]>();

  for (const product of products) {
    const list = grouped.get(product.category) ?? [];
    list.push(product);
    grouped.set(product.category, list);
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!process.env.DATABASE_URL) {
    const demo = demoProducts().find((product) => product.slug === slug);
    if (!demo) {
      return null;
    }

    return {
      ...demo,
      autoPriceTest: true,
      experiments: [],
      supplierProducts: [],
    };
  }

  try {
    const product = await db.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        imageUrl: true,
        salePrice: true,
        supplierCost: true,
        minMarginPct: true,
        shippingDays: true,
        isActive: true,
        returnRisk: true,
        autoPriceTest: true,
        experiments: {
          where: { isActive: true },
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            variant: true,
            testPrice: true,
            isActive: true,
          },
        },
        supplierProducts: {
          orderBy: [{ isPreferred: "desc" }, { stock: "desc" }],
          select: {
            id: true,
            supplierId: true,
            supplierSku: true,
            stock: true,
            isPreferred: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    const normalized = toStoreProduct(product);
    if (!passesMargin(normalized)) {
      return null;
    }

    return {
      ...normalized,
      autoPriceTest: product.autoPriceTest,
      experiments: product.experiments.map((experiment) => ({
        ...experiment,
        testPrice: Number(experiment.testPrice),
      })),
      supplierProducts: product.supplierProducts,
    };
  } catch {
    const demo = demoProducts().find((product) => product.slug === slug);
    if (!demo) {
      return null;
    }

    return {
      ...demo,
      autoPriceTest: true,
      experiments: [],
      supplierProducts: [],
    };
  }
}

export async function resolveCartItems(payload: CheckoutPayload): Promise<ResolvedCartItem[]> {
  if (payload.items.length === 0) {
    return [];
  }

  if (!process.env.DATABASE_URL) {
    const byId = new Map(demoProducts().map((product) => [product.id, product]));
    return payload.items
      .map((item) => {
        const product = byId.get(item.productId);
        if (!product || !passesMargin(product)) {
          return null;
        }

        return {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          quantity: item.quantity,
          salePrice: product.salePrice,
          supplierCost: product.supplierCost,
        } satisfies ResolvedCartItem;
      })
      .filter((item): item is ResolvedCartItem => Boolean(item));
  }

  const productIds = payload.items.map((item) => item.productId);

  try {
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        imageUrl: true,
        salePrice: true,
        supplierCost: true,
        minMarginPct: true,
      },
    });

    const byId = new Map(
      products.map((product) => [
        product.id,
        {
          ...product,
          salePrice: Number(product.salePrice),
          supplierCost: Number(product.supplierCost),
          minMarginPct: Number(product.minMarginPct),
        },
      ]),
    );

    return payload.items
      .map((item) => {
        const product = byId.get(item.productId);
        if (!product) {
          return null;
        }

        const margin = evaluateMargin({
          salePrice: product.salePrice,
          supplierCost: product.supplierCost,
          minMarginPct: product.minMarginPct,
        });

        if (!margin.valid || item.quantity <= 0) {
          return null;
        }

        return {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          quantity: item.quantity,
          salePrice: product.salePrice,
          supplierCost: product.supplierCost,
        } satisfies ResolvedCartItem;
      })
      .filter((item): item is ResolvedCartItem => Boolean(item));
  } catch {
    const byId = new Map(demoProducts().map((product) => [product.id, product]));
    return payload.items
      .map((item) => {
        const product = byId.get(item.productId);
        if (!product || !passesMargin(product)) {
          return null;
        }

        return {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          quantity: item.quantity,
          salePrice: product.salePrice,
          supplierCost: product.supplierCost,
        } satisfies ResolvedCartItem;
      })
      .filter((item): item is ResolvedCartItem => Boolean(item));
  }
}
