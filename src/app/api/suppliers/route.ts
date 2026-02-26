import { NextResponse } from "next/server";
import { z } from "zod";
import { listDemoSuppliers, updateDemoSupplier } from "@/admin/demo-state";
import { listSuppliers, updateSupplier } from "@/admin/service";
import { isDatabaseConnectionError } from "@/core/db-errors";

const updateSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  contactEmail: z.string().email().nullable().optional(),
  averageLeadDays: z.number().int().positive().optional(),
  shippingMaxDays: z.number().int().positive().optional(),
});

export async function GET() {
  try {
    const suppliers = await listSuppliers();
    return NextResponse.json({ suppliers });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ suppliers: listDemoSuppliers(), fallback: true });
    }

    const message = error instanceof Error ? error.message : "Unable to load suppliers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json().catch(() => ({})));

    try {
      const supplier = await updateSupplier(payload);
      return NextResponse.json({ supplier });
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      const supplier = updateDemoSupplier(payload);
      return NextResponse.json({ supplier, fallback: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supplier update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
