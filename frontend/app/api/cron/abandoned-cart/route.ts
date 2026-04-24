import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import {
  getAbandonedCartSettings,
  getEligibleAbandonedRecoveries,
  updateRecoveryStatusByActivity,
} from "@/lib/abandoned-cart";
import { sendAbandonedCartReminder } from "@/lib/abandoned-cart-email";

export const dynamic = "force-dynamic";

/**
 * Call this from a cron job (e.g. Vercel Cron or external) to send abandoned-cart emails.
 * Protects with CRON_SECRET so only your scheduler can trigger it.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  
  if (!secret) {
    console.error("[cron] CRON_SECRET not configured - endpoint disabled for security");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }
  
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      message: "Email not configured",
    });
  }

  const settings = await getAbandonedCartSettings();
  if (!settings.enabled || !settings.autoSendEnabled) {
    return NextResponse.json({ ok: true, sent: 0, message: "Automatic reminders disabled" });
  }
  const recoveries = await getEligibleAbandonedRecoveries(settings);
  let sent = 0;
  let failed = 0;

  for (const recovery of recoveries) {
    const result = await sendAbandonedCartReminder({
      recovery,
      source: "AUTOMATIC",
      settings,
    });
    if (result.ok) {
      sent++;
      await prisma.cart.updateMany({
        where: { id: recovery.cartId },
        data: { abandonedCartEmailSentAt: new Date() },
      });
      continue;
    }
    failed++;
    await updateRecoveryStatusByActivity(recovery.id, "ABANDONED");
  }

  return NextResponse.json({ ok: true, sent, failed });
}
