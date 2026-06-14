import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import {
  isEmailConfigured,
  sendOrderConfirmationEmail,
} from "@/lib/email";
import { getTransaction } from "@/lib/maksekeskus";

const DEFAULT_SKU_PREFIX = "default-";

export type MaksekeskusPaymentReturn = {
  amount?: string;
  currency?: string;
  merchant_data?: string;
  message_type?: string;
  reference?: string;
  status?: string;
  transaction?: string;
};

/** Status values seen in payment_return notifications and transaction API. */
const PAID_STATUSES = new Set([
  "COMPLETED",
  "SETTLED",
  "PAID",
  "SUCCESS",
]);

export function isMaksekeskusPaidStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return PAID_STATUSES.has(status.toUpperCase());
}

/**
 * Mark a Maksekeskus order PAID, send confirmation email, decrement stock.
 * Idempotent: only transitions from REQUIRES_PAYMENT.
 */
export async function completeMaksekeskusOrder(orderId: string): Promise<boolean> {
  const didUpdate = await prisma.order.updateMany({
    where: { id: orderId, status: "REQUIRES_PAYMENT" },
    data: { status: "PAID" },
  });

  if (didUpdate.count === 0) {
    return false;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return false;
  }

  if (isEmailConfigured() && order.customerType !== "BUSINESS") {
    const result = await sendOrderConfirmationEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.tax,
      shippingAddress: order.shippingAddress,
      items: order.items,
      customerType: order.customerType,
      companyName: order.companyName ?? undefined,
      companyAddress: order.companyAddress ?? undefined,
      vatNumber: order.vatNumber ?? undefined,
      phone: order.phone ?? undefined,
    });
    if (result.ok) {
      await prisma.order.update({
        where: { id: order.id },
        data: { confirmationEmailSentAt: new Date() },
      });
    }
  }

  await recordEvent("purchase", {
    sessionId: order.sessionId,
    userId: order.userId,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      value: Number(order.total),
      currency: order.currency,
      itemCount: order.items.length,
      paymentMethod: "MAKSEKESKUS",
    },
  });

  for (const item of order.items) {
    if (!item.productId) continue;
    const sku = `${DEFAULT_SKU_PREFIX}${item.productId}`;
    await prisma.inventoryItem.updateMany({
      where: { sku },
      data: { quantity: { decrement: item.quantity } },
    });
  }

  return true;
}

export async function completeMaksekeskusOrderFromReturn(
  payload: MaksekeskusPaymentReturn,
): Promise<boolean> {
  if (payload.message_type !== "payment_return") {
    return false;
  }
  if (!isMaksekeskusPaidStatus(payload.status)) {
    return false;
  }
  const orderId = payload.merchant_data;
  if (!orderId) {
    return false;
  }
  return completeMaksekeskusOrder(orderId);
}

/** Confirm payment via Maksekeskus API when webhook did not arrive yet. */
export async function verifyAndCompleteMaksekeskusOrder(
  orderId: string,
): Promise<"paid" | "pending" | "not_found"> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      maksekeskusTransactionId: true,
    },
  });

  if (!order) {
    return "not_found";
  }

  if (order.status === "PAID") {
    return "paid";
  }

  if (!order.maksekeskusTransactionId) {
    return "pending";
  }

  const result = await getTransaction(order.maksekeskusTransactionId);
  if (!result.ok) {
    console.warn("[maksekeskus] getTransaction failed:", result.error);
    return "pending";
  }

  if (!isMaksekeskusPaidStatus(result.transaction.status)) {
    return "pending";
  }

  await completeMaksekeskusOrder(order.id);
  return "paid";
}

export async function verifyAndCompleteMaksekeskusOrderByNumber(
  orderNumber: string,
): Promise<"paid" | "pending" | "not_found"> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true },
  });
  if (!order) {
    return "not_found";
  }
  return verifyAndCompleteMaksekeskusOrder(order.id);
}
