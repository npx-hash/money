import { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { evaluateMargin, suggestPriceVariants } from "@/products/pricing-engine";

export async function listSuppliers() {
  return db.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function updateSupplier(input: {
  id: string;
  isActive?: boolean;
  contactEmail?: string | null;
  averageLeadDays?: number;
  shippingMaxDays?: number;
}) {
  return db.supplier.update({
    where: { id: input.id },
    data: {
      isActive: input.isActive,
      contactEmail: input.contactEmail,
      averageLeadDays: input.averageLeadDays,
      shippingMaxDays: input.shippingMaxDays,
    },
  });
}

export async function listProductsForAdmin() {
  return db.product.findMany({
    include: {
      supplierProducts: {
        include: {
          supplier: true,
        },
      },
      experiments: {
        where: { isActive: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateProductPricing(input: {
  productId: string;
  salePrice: number;
  autoPriceTest?: boolean;
}) {
  const product = await db.product.findUnique({ where: { id: input.productId } });

  if (!product) {
    throw new Error("Product not found");
  }

  const check = evaluateMargin({
    salePrice: input.salePrice,
    supplierCost: Number(product.supplierCost),
    minMarginPct: Number(product.minMarginPct),
  });

  if (!check.valid) {
    throw new Error(check.reason ?? "Invalid margin");
  }

  return db.product.update({
    where: { id: input.productId },
    data: {
      salePrice: new Prisma.Decimal(input.salePrice),
      autoPriceTest: input.autoPriceTest,
    },
  });
}

export async function toggleProduct(productId: string, isActive: boolean) {
  return db.product.update({
    where: { id: productId },
    data: { isActive },
  });
}

export async function createPriceExperiment(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  const variants = suggestPriceVariants(Number(product.supplierCost), Number(product.salePrice));
  if (variants.length < 2) {
    throw new Error("Not enough safe variants available");
  }

  await db.priceExperiment.updateMany({
    where: { productId, isActive: true },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
  });

  const created = [];
  for (const price of variants) {
    const variant = await db.priceExperiment.create({
      data: {
        productId,
        variant: `variant_${price.toFixed(2).replace(".", "_")}`,
        testPrice: new Prisma.Decimal(price),
      },
    });
    created.push(variant);
  }

  return created;
}
