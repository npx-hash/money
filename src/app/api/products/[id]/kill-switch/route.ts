import { NextResponse } from "next/server";
import { z } from "zod";
import { toggleProduct } from "@/admin/service";

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
    const product = await toggleProduct(id, payload.isActive);
    return NextResponse.json({
      product: {
        id: product.id,
        isActive: product.isActive,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kill-switch update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
