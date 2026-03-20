import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { getCurrentUser } from "@/lib/auth";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string; provider?: string; orderNumber?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const { session_id: sessionId, provider, orderNumber: orderNumberParam } = await searchParams;

  const translations = await getTranslations(locale);
  const t = createT(translations);

  let orderNumber: string | null = null;
  let message = t("checkout.thanksMessage");

  if (provider === "maksekeskus" && orderNumberParam) {
    orderNumber = orderNumberParam;
    message = t("checkout.orderReceivedMessage", { orderNumber: orderNumberParam });
  }

  if (provider !== "maksekeskus" && sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const orderId = (session.metadata?.orderId as string | undefined) ?? null;

      if (orderId && session.payment_status === "paid") {
        await prisma.order.updateMany({
          where: { id: orderId, status: "REQUIRES_PAYMENT" },
          data: {
            status: "PAID",
            stripePaymentIntentId:
              (session.payment_intent as string | null) ?? null,
          },
        });

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { orderNumber: true },
        });
        orderNumber = order?.orderNumber ?? null;
        message = orderNumber
          ? t("checkout.paymentConfirmedOrder", { orderNumber })
          : t("checkout.paymentConfirmed");
      }
    } catch {
      // Ignore and show generic success message.
    }
  }

  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-6 shadow-sm">
          <h1 className="heading-page">{t("checkout.complete")}</h1>
          <p className="mt-2 text-sm text-black">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${prefix}/products`}
              className="rounded-full bg-[#283618] px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-[#FEFAE0] hover:bg-[#283618]/90"
            >
              {t("checkout.continueShopping")}
            </Link>
            <Link
              href={prefix}
              className="rounded-full border border-[#606C38]/40 px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-[#283618] hover:bg-[#606C38]/10"
            >
              {t("common.home")}
            </Link>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
