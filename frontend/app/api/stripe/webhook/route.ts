import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import {
  isEmailConfigured,
  sendOrderConfirmationEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";
/** Stripe signature verification uses Node crypto; avoid edge where body/signature handling can differ. */
export const runtime = "nodejs";

const DEFAULT_SKU_PREFIX = "default-";

function parseWebhookSecrets(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function constructStripeEvent(
  rawBody: string,
  signature: string,
  secrets: string[],
): Stripe.Event {
  let lastErr: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  const secrets = parseWebhookSecrets(process.env.STRIPE_WEBHOOK_SECRET);
  if (secrets.length === 0 || !signature) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(rawBody, signature, secrets);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        payment_intent?: string | null;
        metadata?: { orderId?: string };
      };

      const orderId = session.metadata?.orderId;

      if (!orderId) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const paymentIntentId = (session.payment_intent as string | null) ?? null;

      const didUpdate = await prisma.order.updateMany({
        where: { id: orderId, status: "REQUIRES_PAYMENT" },
        data: {
          status: "PAID",
          stripePaymentIntentId: paymentIntentId,
        },
      });

      // Idempotency: if we already processed this order, do nothing.
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
        },
      });

      // Decrement inventory for each order item, if inventory records exist.
      // Stock is tracked via a default variant SKU: "default-<productId>".
      for (const item of order.items) {
        if (!item.productId) continue;
        const sku = `${DEFAULT_SKU_PREFIX}${item.productId}`;
        await prisma.inventoryItem.updateMany({
          where: { sku },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }
  } catch (err) {
    console.error("Error handling Stripe webhook", err);
    return NextResponse.json({ received: true }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/** Lets you confirm routing (browser/curl GET); Stripe always uses POST. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "Stripe webhooks use POST with Stripe-Signature and raw JSON body.",
    },
    { status: 200 },
  );
}

