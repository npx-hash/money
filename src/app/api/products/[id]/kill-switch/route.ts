import { NextResponse } from "next/server";
import { z } from "zod";
import { toggleDemoProduct } from "@/admin/demo-state";
import { toggleProduct } from "@/admin/service";
import { isDatabaseConnectionError } from "@/core/db-errors";

const bodySchema = z.object({
  isActive: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = bodySchema.parse(await request.json());

    try {
      const product = await toggleProduct(id, payload.isActive);
      return NextResponse.json({
        product: {
          id: product.id,
          isActive: product.isActive,
        },
      });
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      const product = toggleDemoProduct(id, payload.isActive);
      return NextResponse.json({ product, fallback: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kill-switch update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
