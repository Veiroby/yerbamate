import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReviewRequestEmail, isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

const DAYS_AFTER_ORDER = 4;

/**
 * Call from a cron job (e.g. daily) to send "leave a review" emails to customers
 * 4 days after they placed an order. Protects with CRON_SECRET.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron/review-request] CRON_SECRET not configured");
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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_AFTER_ORDER);
  cutoff.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { lte: cutoff },
      reviewRequestEmailSentAt: null,
      status: { in: ["PAID", "PROCESSING", "SHIPPED"] },
      items: { some: { productId: { not: null } } },
    },
    include: {
      items: {
        where: { productId: { not: null } },
        include: {
          product: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const siteOrigin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
  let sent = 0;

  for (const order of orders) {
    const productMap = new Map<string, { name: string; url: string }>();
    for (const item of order.items) {
      const product = item.product;
      if (!product?.slug) continue;
      productMap.set(product.slug, {
        name: product.name,
        url: `/products/${encodeURIComponent(product.slug)}#reviews-heading`,
      });
    }
    const productLinks = Array.from(productMap.values());
    if (productLinks.length === 0) continue;

    const result = await sendReviewRequestEmail({
      email: order.email,
      customerName: order.shippingAddress && typeof order.shippingAddress === "object" && "name" in order.shippingAddress
        ? String((order.shippingAddress as { name?: string }).name ?? "").trim() || null
        : null,
      productLinks: productLinks.map((p) => ({
        name: p.name,
        url: `${siteOrigin}${p.url}`,
      })),
      siteOrigin,
    });

    if (result.ok) {
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewRequestEmailSentAt: new Date() },
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
