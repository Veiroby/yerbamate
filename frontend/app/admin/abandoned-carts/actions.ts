"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";
import { getAbandonedCartSettings } from "@/lib/abandoned-cart";
import { sendAbandonedCartReminder } from "@/lib/abandoned-cart-email";

async function getRecoveryForSending(recoveryId: string) {
  return prisma.abandonedCartRecovery.findUnique({
    where: { id: recoveryId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      cart: {
        include: {
          items: {
            include: {
              product: { select: { name: true, currency: true } },
            },
          },
        },
      },
    },
  });
}

export async function sendAbandonedReminderAction(formData: FormData) {
  const admin = await requireAdminWrite();
  const recoveryId = formData.get("recoveryId")?.toString();
  if (!recoveryId) return;
  const settings = await getAbandonedCartSettings();
  const recovery = await getRecoveryForSending(recoveryId);
  if (!recovery) return;

  const result = await sendAbandonedCartReminder({
    recovery,
    source: "MANUAL",
    sentByAdminId: admin.id,
    settings,
  });

  await writeAuditLog(
    admin.id,
    "abandoned_cart.reminder_sent",
    "AbandonedCartRecovery",
    recovery.id,
    { success: result.ok, error: result.ok ? null : result.error },
  );
  revalidatePath("/admin/abandoned-carts");
}

export async function sendAbandonedReminderBulkAction(formData: FormData) {
  const admin = await requireAdminWrite();
  const ids = formData
    .getAll("recoveryIds")
    .map((v) => v.toString())
    .filter(Boolean);
  if (ids.length === 0) return;

  const settings = await getAbandonedCartSettings();
  let sent = 0;
  for (const recoveryId of ids) {
    const recovery = await getRecoveryForSending(recoveryId);
    if (!recovery) continue;
    const result = await sendAbandonedCartReminder({
      recovery,
      source: "MANUAL",
      sentByAdminId: admin.id,
      settings,
    });
    if (result.ok) sent++;
  }
  await writeAuditLog(admin.id, "abandoned_cart.reminder_bulk_sent", "AbandonedCartRecovery", null, {
    selected: ids.length,
    sent,
  });
  revalidatePath("/admin/abandoned-carts");
}

export async function saveAbandonedCartSettingsAction(formData: FormData) {
  const admin = await requireAdminWrite();
  const enabled = formData.get("enabled") === "on";
  const autoSendEnabled = formData.get("autoSendEnabled") === "on";
  const timeoutMinutes = Math.max(10, Number(formData.get("timeoutMinutes") || 1440));
  const cooldownHours = Math.max(1, Number(formData.get("cooldownHours") || 24));
  const firstDelayHours = Math.max(1, Number(formData.get("firstDelayHours") || 24));
  const secondDelayHours = Math.max(firstDelayHours, Number(formData.get("secondDelayHours") || 72));
  const thirdDelayHours = Math.max(secondDelayHours, Number(formData.get("thirdDelayHours") || 168));
  const senderName = formData.get("senderName")?.toString().trim() || null;
  const senderEmail = formData.get("senderEmail")?.toString().trim() || null;

  await prisma.abandonedCartSettings.upsert({
    where: { id: "default" },
    update: {
      enabled,
      autoSendEnabled,
      timeoutMinutes,
      cooldownHours,
      firstDelayHours,
      secondDelayHours,
      thirdDelayHours,
      senderName,
      senderEmail,
    },
    create: {
      id: "default",
      enabled,
      autoSendEnabled,
      timeoutMinutes,
      cooldownHours,
      firstDelayHours,
      secondDelayHours,
      thirdDelayHours,
      senderName,
      senderEmail,
    },
  });

  await writeAuditLog(admin.id, "abandoned_cart.settings_updated", "AbandonedCartSettings", "default", {
    enabled,
    autoSendEnabled,
    timeoutMinutes,
    cooldownHours,
    firstDelayHours,
    secondDelayHours,
    thirdDelayHours,
  });
  revalidatePath("/admin/abandoned-carts");
}
