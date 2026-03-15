import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ session_id?: string; provider?: string; orderNumber?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { session_id: sessionId, provider, orderNumber: orderNumberParam } = await searchParams;

  let orderNumber: string | null = null;
  let message =
    "Thanks! If your payment was successful, you will receive a confirmation email shortly.";

  if (provider === "maksekeskus" && orderNumberParam) {
    orderNumber = orderNumberParam;
    message = `Order ${orderNumberParam} received. You will receive a confirmation email once the payment is confirmed.`;
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
          ? `Payment confirmed. Your order number is ${orderNumber}.`
          : "Payment confirmed.";
      }
    } catch {
      // Ignore and show generic success message.
    }
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-6 shadow-sm">
          <h1 className="heading-page">Checkout complete</h1>
          <p className="mt-2 text-sm text-[#606C38]">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-full bg-[#283618] px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-[#FEFAE0] hover:bg-[#283618]/90"
            >
              Continue shopping
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#606C38]/40 px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-[#283618] hover:bg-[#606C38]/10"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

