import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { validatePaymentReturnMac } from "@/lib/maksekeskus";
import {
  isEmailConfigured,
  sendOrderConfirmationEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const DEFAULT_SKU_PREFIX = "default-";

type PaymentReturnPayload = {
  amount?: string;
  currency?: string;
  merchant_data?: string;
  message_type?: string;
  reference?: string;
  status?: string;
  transaction?: string;
};

export async function POST(request: Request) {
  // Maksekeskus sends application/x-www-form-urlencoded with json and mac.
  const contentType = request.headers.get("content-type") ?? "";
  let jsonString: string;
  let mac: string;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    jsonString = formData.get("json")?.toString() ?? "";
    mac = formData.get("mac")?.toString() ?? "";
  } else {
    const body = await request.json().catch(() => ({}));
    jsonString = typeof body.json === "string" ? body.json : "";
    mac = typeof body.mac === "string" ? body.mac : "";
  }

  if (!jsonString || !mac) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const valid = await validatePaymentReturnMac(jsonString, mac);
  if (!valid) {
    console.error("[maksekeskus notify] Invalid MAC");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let payload: PaymentReturnPayload;
  try {
    payload = JSON.parse(jsonString) as PaymentReturnPayload;
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (payload.message_type !== "payment_return") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Only mark order PAID on COMPLETED (idempotent: only update if REQUIRES_PAYMENT).
  if (payload.status !== "COMPLETED") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const orderId = payload.merchant_data;
  if (!orderId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const didUpdate = await prisma.order.updateMany({
    where: { id: orderId, status: "REQUIRES_PAYMENT" },
    data: { status: "PAID" },
  });

  if (didUpdate.count === 0) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (isEmailConfigured()) {
    const result = await sendOrderConfirmationEmail({
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

  return NextResponse.json({ received: true }, { status: 200 });
}
