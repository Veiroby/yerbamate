import "server-only";

import type {
  AbandonedCartRecovery,
  AbandonedCartReminderLog,
  AbandonedCartSettings,
  AbandonedReminderStage,
  ReminderSendSource,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail, renderAbandonedCartHtml } from "@/lib/email";
import {
  calculateNextReminderAt,
  computeReminderStage,
  getAbandonedCartSettings,
} from "@/lib/abandoned-cart";

type RecoveryForSend = AbandonedCartRecovery & {
  user: { id: string; email: string; name: string | null } | null;
  cart: {
    id: string;
    items: {
      quantity: number;
      unitPrice: { toString(): string };
      product: { name: string; currency: string } | null;
    }[];
  };
};

const SUBJECT_BY_STAGE: Record<AbandonedReminderStage, string> = {
  FIRST: "You left something in your cart",
  SECOND: "Your cart is still waiting",
  THIRD: "Final reminder: your cart items are almost gone",
};

function getRecoveryUrl(token: string) {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  return `${origin}/api/cart/recover/${token}`;
}

function getSubjectForStage(stage: AbandonedReminderStage, settings: AbandonedCartSettings) {
  if (stage === "FIRST" && settings.firstSubject?.trim()) return settings.firstSubject.trim();
  if (stage === "SECOND" && settings.secondSubject?.trim()) return settings.secondSubject.trim();
  if (stage === "THIRD" && settings.thirdSubject?.trim()) return settings.thirdSubject.trim();
  return SUBJECT_BY_STAGE[stage];
}

function cartTotal(items: RecoveryForSend["cart"]["items"]) {
  return items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
}

export async function sendAbandonedCartReminder(options: {
  recovery: RecoveryForSend;
  source: ReminderSendSource;
  sentByAdminId?: string;
  force?: boolean;
  settings?: AbandonedCartSettings;
}) {
  const settings = options.settings ?? (await getAbandonedCartSettings());
  const recovery = options.recovery;
  const email = recovery.email ?? recovery.user?.email ?? null;
  if (!email) {
    return { ok: false, error: "No customer email on cart" };
  }
  if (!recovery.recoveryToken) {
    return { ok: false, error: "Recovery token is missing" };
  }

  const stage = computeReminderStage(recovery);
  if (!stage) return { ok: false, error: "All reminder stages already sent" };

  const now = new Date();
  if (!options.force && recovery.lastReminderSentAt) {
    const cooldownMs = settings.cooldownHours * 60 * 60 * 1000;
    if (now.getTime() - recovery.lastReminderSentAt.getTime() < cooldownMs) {
      return { ok: false, error: "Reminder cooldown active" };
    }
  }

  const currency = recovery.cart.items[0]?.product?.currency ?? "EUR";
  const total = cartTotal(recovery.cart.items);
  const items = recovery.cart.items.map((item) => ({
    productName: item.product?.name ?? "Product",
    quantity: item.quantity,
    lineTotal: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(item.unitPrice) * item.quantity),
  }));
  const siteOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  const recoveryUrl = getRecoveryUrl(recovery.recoveryToken);
  const html = renderAbandonedCartHtml({
    items,
    cartTotal: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(total),
    currency,
    cartUrl: recoveryUrl,
    siteOrigin,
  });

  const subject = getSubjectForStage(stage, settings);
  const result = await sendEmail({
    to: email,
    subject,
    html,
  });

  const logData: Omit<AbandonedCartReminderLog, "id"> = {
    recoveryId: recovery.id,
    stage,
    source: options.source,
    sentByAdminId: options.sentByAdminId ?? null,
    sentAt: now,
    email,
    subject,
    success: result.ok,
    error: result.ok ? null : result.error ?? "send failed",
  };
  await prisma.abandonedCartReminderLog.create({ data: logData });

  if (!result.ok) return result;

  await prisma.abandonedCartRecovery.update({
    where: { id: recovery.id },
    data: {
      status: "ABANDONED",
      abandonedAt: recovery.abandonedAt ?? now,
      reminderCount: { increment: 1 },
      lastReminderStage: stage,
      lastReminderSentAt: now,
      nextReminderAt: calculateNextReminderAt(stage, now, settings),
    },
  });
  await prisma.cart.updateMany({
    where: { id: recovery.cartId },
    data: { abandonedCartEmailSentAt: now },
  });

  return { ok: true };
}
