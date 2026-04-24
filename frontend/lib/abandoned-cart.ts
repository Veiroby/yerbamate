import "server-only";

import { randomBytes } from "node:crypto";
import type {
  AbandonedCartRecovery,
  AbandonedCartSettings,
  AbandonedReminderStage,
  AbandonedCartStatus,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

type RecoveryWithCart = AbandonedCartRecovery & {
  cart: {
    id: string;
    sessionId: string | null;
    email: string | null;
    userId: string | null;
    updatedAt: Date;
    items: {
      id: string;
      quantity: number;
      unitPrice: { toString(): string };
      product: { name: string; currency: string } | null;
      variant: { sku: string } | null;
    }[];
  };
  user: { id: string; email: string; name: string | null } | null;
};

export async function getAbandonedCartSettings(): Promise<AbandonedCartSettings> {
  const timeoutMinutes = Number(process.env.ABANDONED_CART_DEFAULT_TIMEOUT_MINUTES || "1440");
  const cooldownHours = Number(process.env.ABANDONED_CART_DEFAULT_COOLDOWN_HOURS || "24");
  const firstDelayHours = Number(process.env.ABANDONED_CART_DEFAULT_FIRST_DELAY_HOURS || "24");
  const secondDelayHours = Number(process.env.ABANDONED_CART_DEFAULT_SECOND_DELAY_HOURS || "72");
  const thirdDelayHours = Number(process.env.ABANDONED_CART_DEFAULT_THIRD_DELAY_HOURS || "168");
  return prisma.abandonedCartSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      timeoutMinutes: Number.isFinite(timeoutMinutes) ? timeoutMinutes : 1440,
      cooldownHours: Number.isFinite(cooldownHours) ? cooldownHours : 24,
      firstDelayHours: Number.isFinite(firstDelayHours) ? firstDelayHours : 24,
      secondDelayHours: Number.isFinite(secondDelayHours) ? secondDelayHours : 72,
      thirdDelayHours: Number.isFinite(thirdDelayHours) ? thirdDelayHours : 168,
    },
  });
}

function makeRecoveryToken() {
  return randomBytes(24).toString("base64url");
}

export async function ensureRecoveryForCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    select: { id: true, sessionId: true, userId: true, email: true, updatedAt: true },
  });
  if (!cart) return null;

  const existing = await prisma.abandonedCartRecovery.findUnique({ where: { cartId } });
  if (existing) return existing;

  return prisma.abandonedCartRecovery.create({
    data: {
      cartId: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      email: cart.email,
      isGuest: cart.userId == null,
      lastActivityAt: cart.updatedAt,
      recoveryToken: cart.sessionId ? makeRecoveryToken() : null,
    },
  });
}

export async function syncRecoveryIdentityFromCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    select: { id: true, sessionId: true, userId: true, email: true, updatedAt: true },
  });
  if (!cart) return;

  const existing = await prisma.abandonedCartRecovery.findUnique({ where: { cartId } });
  if (!existing) {
    await ensureRecoveryForCart(cartId);
    return;
  }

  const updates: Record<string, unknown> = {
    sessionId: cart.sessionId,
    userId: cart.userId,
    email: cart.email,
    isGuest: cart.userId == null,
    lastActivityAt: cart.updatedAt,
  };
  if (!existing.recoveryToken && cart.sessionId) {
    updates.recoveryToken = makeRecoveryToken();
  }

  await prisma.abandonedCartRecovery.update({
    where: { cartId },
    data: updates,
  });
}

export async function touchRecoveryFromSession(sessionId: string) {
  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    select: { id: true, updatedAt: true },
  });
  if (!cart) return;
  await ensureRecoveryForCart(cart.id);
  await prisma.abandonedCartRecovery.updateMany({
    where: { cartId: cart.id },
    data: {
      lastActivityAt: new Date(),
      status: "ACTIVE",
      abandonedAt: null,
    },
  });
}

export async function markRecoveryForOrderConversion(sessionId: string, email?: string | null) {
  await prisma.abandonedCartRecovery.updateMany({
    where: { sessionId },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      nextReminderAt: null,
      ...(email ? { email } : {}),
    },
  });
}

export async function markRecoveryAsRecoveredByToken(token: string) {
  return prisma.abandonedCartRecovery.updateMany({
    where: { recoveryToken: token },
    data: {
      status: "RECOVERED",
      recoveredAt: new Date(),
    },
  });
}

export function computeReminderStage(
  recovery: Pick<AbandonedCartRecovery, "reminderCount" | "lastReminderStage">,
): AbandonedReminderStage | null {
  if (recovery.reminderCount <= 0) return "FIRST";
  if (recovery.lastReminderStage === "FIRST") return "SECOND";
  if (recovery.lastReminderStage === "SECOND") return "THIRD";
  return null;
}

export async function getEligibleAbandonedRecoveries(
  settings?: AbandonedCartSettings,
): Promise<RecoveryWithCart[]> {
  const cfg = settings ?? (await getAbandonedCartSettings());
  if (!cfg.enabled) return [];

  const now = new Date();
  const abandonedCutoff = new Date(now.getTime() - cfg.timeoutMinutes * 60 * 1000);
  const convertedSessions = await prisma.order.findMany({
    where: { sessionId: { not: null } },
    select: { sessionId: true },
  });
  const convertedSet = new Set(convertedSessions.map((o) => o.sessionId).filter(Boolean));

  const recoveries = await prisma.abandonedCartRecovery.findMany({
    where: {
      status: { in: ["ACTIVE", "ABANDONED"] },
      lastActivityAt: { lte: abandonedCutoff },
      OR: [{ nextReminderAt: null }, { nextReminderAt: { lte: now } }],
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      cart: {
        include: {
          items: {
            include: {
              product: { select: { name: true, currency: true } },
              variant: { select: { sku: true } },
            },
          },
        },
      },
    },
    orderBy: { lastActivityAt: "asc" },
  });

  return recoveries.filter((r) => {
    if (!r.sessionId) return false;
    if (convertedSet.has(r.sessionId)) return false;
    if (!r.cart || r.cart.items.length === 0) return false;
    return true;
  });
}

export function calculateNextReminderAt(
  stage: AbandonedReminderStage,
  sentAt: Date,
  settings: Pick<
    AbandonedCartSettings,
    "firstDelayHours" | "secondDelayHours" | "thirdDelayHours"
  >,
) {
  const delayHours =
    stage === "FIRST"
      ? settings.secondDelayHours
      : stage === "SECOND"
        ? settings.thirdDelayHours
        : 0;
  if (delayHours <= 0) return null;
  return new Date(sentAt.getTime() + delayHours * 60 * 60 * 1000);
}

export async function updateRecoveryStatusByActivity(
  recoveryId: string,
  status: AbandonedCartStatus,
  extra?: Partial<AbandonedCartRecovery>,
) {
  const now = new Date();
  await prisma.abandonedCartRecovery.update({
    where: { id: recoveryId },
    data: {
      status,
      abandonedAt: status === "ABANDONED" ? now : undefined,
      recoveredAt: status === "RECOVERED" ? now : undefined,
      convertedAt: status === "CONVERTED" ? now : undefined,
      ...(extra ?? {}),
    },
  });
}
