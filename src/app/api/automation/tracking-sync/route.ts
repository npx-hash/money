import { NextResponse } from "next/server";
import { sendTrackingEmailsForUpdates } from "@/core/automation-service";
import { syncTrackingForOpenOrders } from "@/suppliers/router";

export const runtime = "nodejs";

export async function POST() {
  try {
    const updates = await syncTrackingForOpenOrders();
    await sendTrackingEmailsForUpdates(updates);

    return NextResponse.json({
      synced: updates.length,
      updates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
