import { NextResponse } from "next/server";
import { z } from "zod";
import { listDemoSuppliers, updateDemoSupplier } from "@/admin/demo-state";
import { listSuppliers, updateSupplier } from "@/admin/service";

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
  } catch {
    return NextResponse.json({ suppliers: listDemoSuppliers(), fallback: true });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.parse(await request.json().catch(() => ({})));

    try {
      const supplier = await updateSupplier(payload);
      return NextResponse.json({ supplier });
    } catch {
      const supplier = updateDemoSupplier(payload);
      return NextResponse.json({ supplier, fallback: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supplier update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
