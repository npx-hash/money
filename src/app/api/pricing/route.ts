import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createDemoPriceExperiment,
  listDemoPricingProducts,
  updateDemoPricing,
} from "@/admin/demo-state";
import { createPriceExperiment, listProductsForAdmin, updateProductPricing } from "@/admin/service";
import { isDatabaseConnectionError } from "@/core/db-errors";

const updateSchema = z.object({
  productId: z.string().min(1),
  salePrice: z.number().positive(),
  autoPriceTest: z.boolean().optional(),
});

const experimentSchema = z.object({
  productId: z.string().min(1),
});

export async function GET() {
  try {
    const products = await listProductsForAdmin();

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        salePrice: Number(product.salePrice),
        supplierCost: Number(product.supplierCost),
        minMarginPct: Number(product.minMarginPct),
        autoPriceTest: product.autoPriceTest,
      })),
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({
        products: listDemoPricingProducts(),
        fallback: true,
      });
    }

    const message = error instanceof Error ? error.message : "Pricing read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json());

    try {
      const product = await updateProductPricing(payload);
      return NextResponse.json({
        product: {
          id: product.id,
          salePrice: Number(product.salePrice),
        },
      });
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      const product = updateDemoPricing(payload);
      return NextResponse.json({
        product: {
          id: product.id,
          salePrice: product.salePrice,
        },
        fallback: true,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pricing update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = experimentSchema.parse(await request.json());

    try {
      const experiments = await createPriceExperiment(payload.productId);
      return NextResponse.json({
        experiments: experiments.map((experiment) => ({
          id: experiment.id,
          variant: experiment.variant,
          testPrice: Number(experiment.testPrice),
        })),
      });
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      const experiments = createDemoPriceExperiment(payload.productId);
      return NextResponse.json({
        experiments: experiments.map((experiment) => ({
          id: experiment.id,
          variant: experiment.variant,
          testPrice: experiment.testPrice,
        })),
        fallback: true,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Experiment creation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
