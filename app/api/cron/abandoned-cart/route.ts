import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, renderAbandonedCartHtml, isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";
const ABANDONED_HOURS = 24;

/**
 * Call this from a cron job (e.g. Vercel Cron or external) to send abandoned-cart emails.
 * Protects with CRON_SECRET so only your scheduler can trigger it.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      message: "Email not configured",
    });
  }

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - ABANDONED_HOURS);

  const ordersWithSession = await prisma.order.findMany({
    where: { sessionId: { not: null } },
    select: { sessionId: true },
  });
  const convertedSessions = new Set(
    ordersWithSession.map((o) => o.sessionId).filter(Boolean),
  );

  const carts = await prisma.cart.findMany({
    where: {
      sessionId: { not: null },
      updatedAt: { lt: cutoff },
      abandonedCartEmailSentAt: null,
      items: { some: {} },
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: { select: { email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const siteOrigin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://localhost:3000";
  const cartUrl = `${siteOrigin}/cart`;
  let sent = 0;

  for (const cart of carts) {
    if (!cart.sessionId || convertedSessions.has(cart.sessionId)) continue;

    const email = cart.email ?? cart.user?.email ?? null;
    if (!email) continue;

    const currency = cart.items[0]?.product?.currency ?? "USD";
    const items = cart.items.map((item) => {
      const total = Number(item.unitPrice) * item.quantity;
      return {
        productName: item.product?.name ?? "Product",
        quantity: item.quantity,
        lineTotal: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(total),
      };
    });
    const cartTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(
      cart.items.reduce(
        (sum, i) => sum + Number(i.unitPrice) * i.quantity,
        0,
      ),
    );

    const html = renderAbandonedCartHtml({
      items,
      cartTotal,
      currency,
      cartUrl,
    });

    const result = await sendEmail({
      to: email,
      subject: "You left something in your cart",
      html,
    });

    if (result.ok) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { abandonedCartEmailSentAt: new Date() },
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
