import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import {
  isEmailConfigured,
  sendOrderConfirmationEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const DEFAULT_SKU_PREFIX = "default-";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
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

      if (isEmailConfigured()) {
        const result = await sendOrderConfirmationEmail({
          orderNumber: order.orderNumber,
          email: order.email,
          total: Number(order.total),
          currency: order.currency,
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

