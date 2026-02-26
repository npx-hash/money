import { NextResponse } from "next/server";
import { runLowStockAlertSweep } from "@/core/automation-service";
import { isDatabaseConnectionError } from "@/core/db-errors";

export const runtime = "nodejs";

export async function POST() {
  try {
    const alerts = await runLowStockAlertSweep();
    return NextResponse.json({ alertsGenerated: alerts.length, alerts });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({
        alertsGenerated: 0,
        alerts: [],
        fallback: true,
      });
    }

    const message = error instanceof Error ? error.message : "Low-stock alert sweep failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
