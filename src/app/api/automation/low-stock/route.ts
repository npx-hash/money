import { NextResponse } from "next/server";
import { runLowStockAlertSweep } from "@/core/automation-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const alerts = await runLowStockAlertSweep();
    return NextResponse.json({ alertsGenerated: alerts.length, alerts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Low-stock alert sweep failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
