import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateShippingForOrder } from "@/lib/shipping/service";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { CheckoutForm } from "@/app/checkout/checkout-form";
import { isMaksekeskusConfigured } from "@/lib/maksekeskus";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import { calculateBundleSavings } from "@/lib/pricing/bundles";

async function getCartWithItems() {
  const sessionId = (await cookies()).get("cart_session_id")?.value;
  if (!sessionId) return null;

  return prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: "asc" }, take: 1 },
              bundleOffers: { where: { active: true } },
            },
          },
          variant: true,
        },
      },
    },
  });
}

async function getGlobalBundleOffers() {
  return prisma.bundleOffer.findMany({
    where: { active: true, productId: null },
    orderBy: { discountPercent: "desc" },
    select: { minQuantity: true, discountPercent: true },
  });
}

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ discountCode?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const { discountCode } = await searchParams;
  const [cart, user, globalBundles] = await Promise.all([
    getCartWithItems(),
    getCurrentUser(),
    getGlobalBundleOffers(),
  ]);
  const items = cart?.items ?? [];

  const subtotal = items.reduce((sum, item) => {
    const price = item.unitPrice as unknown as number;
    return sum + price * item.quantity;
  }, 0);

  const bundleSavings = calculateBundleSavings(
    items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: item.product
        ? {
            bundleOffers: item.product.bundleOffers.map((b) => ({
              minQuantity: b.minQuantity,
              discountPercent: b.discountPercent,
            })),
          }
        : null,
    })),
    globalBundles,
  );

  const cartFingerprint =
    items.length === 0
      ? ""
      : [...items]
          .map((item) => `${item.id}:${item.quantity}`)
          .sort()
          .join("|");

  const destination = { country: "LV" };
  const discountedSubtotalForShipping = Math.max(0, subtotal - bundleSavings);
  const shipping = await calculateShippingForOrder(
    destination,
    cart,
    null,
    discountedSubtotalForShipping,
    locale,
  );

  let discountAmount = 0;
  let appliedDiscountCode: string | null = null;

  if (discountCode) {
    const discount = await prisma.discountCode.findUnique({
      where: { code: discountCode.toUpperCase() },
    });

    if (discount && discount.active) {
      const isExpired = discount.expiresAt && new Date(discount.expiresAt) < new Date();
      const isMaxUsed = discount.maxUses && discount.usedCount >= discount.maxUses;
      const meetsMinOrder = !discount.minOrderValue || subtotal >= Number(discount.minOrderValue);

      if (!isExpired && !isMaxUsed && meetsMinOrder) {
        appliedDiscountCode = discount.code;
        if (discount.type === "PERCENTAGE") {
          discountAmount = Math.round((subtotal * Number(discount.value)) / 100 * 100) / 100;
        } else {
          discountAmount = Math.min(Number(discount.value), subtotal);
        }
      }
    }
  }

  const estimatedTotal = Math.max(0, subtotal - bundleSavings - discountAmount) + (shipping.amount ?? 0);
  const currency = items[0]?.product?.currency ?? "EUR";
  const prefix = `/${locale}`;
  const translations = await getTranslations(locale);
  const t = createT(translations);
  const makseEnabled = process.env.MAKSEKESKUS_ENABLED === "true";

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href={prefix} className="transition hover:text-gray-900">
                {t("common.home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`${prefix}/cart`} className="transition hover:text-gray-900">
                {t("nav.cart")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-gray-900" aria-current="page">
              {t("checkout.checkout")}
            </li>
          </ol>
        </nav>

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
              {t("checkout.checkout")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("checkout.guestCheckout")}
            </p>
          </div>
          <Link
            href={`${prefix}/cart`}
            className="text-sm font-medium uppercase tracking-wide text-gray-600 transition hover:text-black"
          >
            {t("checkout.backToCart")}
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              {t("checkout.cartEmpty")}{" "}
              <Link href={`${prefix}/products`} className="font-medium text-black underline hover:no-underline">
                {t("checkout.shop")}
              </Link>{" "}
              {t("checkout.beforeCheckingOut")}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <CheckoutForm
              currency={currency}
              subtotal={subtotal}
              cartFingerprint={cartFingerprint}
              discountCode={appliedDiscountCode}
              maksekeskusAvailable={makseEnabled && isMaksekeskusConfigured()}
              locale={locale}
            />

            <div className="lg:sticky lg:top-6 lg:self-start">
              <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-black">{t("checkout.orderSummary")}</h2>
                <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-1 items-center gap-3 min-w-0">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 aspect-square">
                          {item.product?.images?.[0] ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.images[0].altText ?? item.product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-black">
                            {item.product?.name ?? t("common.product")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("checkout.qty")} {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-black shrink-0">
                        {currency} {(item.unitPrice as unknown as number).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t("cart.subtotal")}</dt>
                    <dd className="font-medium text-black">
                      {currency} {subtotal.toFixed(2)}
                    </dd>
                  </div>
                  {bundleSavings > 0 && (
                    <div className="flex justify-between text-red-600">
                      <dt>Bundle savings</dt>
                      <dd className="font-medium">-{currency} {bundleSavings.toFixed(2)}</dd>
                    </div>
                  )}
                  {appliedDiscountCode && discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <dt>{t("cart.discountCode", { code: appliedDiscountCode })}</dt>
                      <dd className="font-medium">
                        -{currency} {discountAmount.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t("checkout.shipping")}</dt>
                    <dd className="font-medium text-black">
                      {currency} {(shipping.amount ?? 0).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <dt className="font-bold text-black">{t("checkout.estimatedTotal")}</dt>
                    <dd className="font-bold text-black">
                      {currency} {estimatedTotal.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
