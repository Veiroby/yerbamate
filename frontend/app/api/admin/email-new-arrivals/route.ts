import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, isEmailConfigured, SITE_NAME } from "@/lib/email";
import {
  renderNewArrivalsEmailHtml,
  resolveEmailAssetUrl,
  formatMoney,
  type NewProductRow,
} from "@/lib/email-layout";

const MAX_PRODUCTS = 15;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Email not configured" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rawDays = typeof body.days === "number" ? body.days : DEFAULT_DAYS;
    const days = Math.min(Math.max(1, Math.floor(rawDays)), MAX_DAYS);

    const siteOrigin =
      process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://yerbatea.lv";

    const since = new Date();
    since.setDate(since.getDate() - days);

    const products = await prisma.product.findMany({
      where: {
        active: true,
        archived: false,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_PRODUCTS,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    });

    if (products.length === 0) {
      return NextResponse.json(
        {
          error: `No new products in the last ${days} days. Try a longer window or add products first.`,
        },
        { status: 400 },
      );
    }

    const rows: NewProductRow[] = products.map((p) => {
      const img = p.images[0]?.url ?? null;
      return {
        name: p.name,
        slug: p.slug,
        priceFormatted: formatMoney(Number(p.price), p.currency),
        imageUrl: resolveEmailAssetUrl(img, siteOrigin),
      };
    });

    const html = renderNewArrivalsEmailHtml({
      siteOrigin,
      products: rows,
      days,
    });

    const subject = `What's new at ${SITE_NAME} — ${products.length} fresh arrival${products.length === 1 ? "" : "s"}`;

    const subscribers = await prisma.newsletterSubscriber.findMany({
      select: { email: true },
    });
    const recipients = subscribers.map((s) => s.email);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No newsletter subscribers to send to" },
        { status: 400 },
      );
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: `New arrivals (${days}d) — ${new Date().toISOString().slice(0, 10)}`,
        subject,
        htmlContent: html,
      },
    });

    let sentCount = 0;
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (email) => {
          const result = await sendEmail({ to: email, subject, html });
          if (result.ok) sentCount++;
        }),
      );
    }

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { sentAt: new Date(), sentCount },
    });

    return NextResponse.json({
      ok: true,
      sentCount,
      recipientCount: recipients.length,
      productCount: products.length,
      days,
      message: `New arrivals email sent to ${sentCount} of ${recipients.length} subscribers`,
    });
  } catch (error) {
    console.error("[email-new-arrivals] POST error:", error);
    return NextResponse.json({ error: "Failed to send new arrivals email" }, { status: 500 });
  }
}
