import Link from "next/link";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { CartOrderSummary } from "@/app/cart/cart-order-summary";
import { CartItem } from "@/app/cart/cart-item";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

async function getCart() {
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
              bundleOffers: {
                where: { active: true },
              },
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
  });
}

function calculateBundleSavings(
  items: Array<{
    quantity: number;
    unitPrice: unknown;
    product: {
      id: string;
      bundleOffers: Array<{ minQuantity: number; discountPercent: unknown }>;
    } | null;
  }>,
  globalBundles: Array<{ minQuantity: number; discountPercent: unknown }>,
): number {
  let totalSavings = 0;

  for (const item of items) {
    if (!item.product) continue;

    const price = Number(item.unitPrice);
    const qty = item.quantity;
    const lineTotal = price * qty;

    const productBundles = item.product.bundleOffers || [];
    const allBundles = [...productBundles, ...globalBundles];

    const applicableBundles = allBundles
      .filter((b) => qty >= b.minQuantity)
      .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));

    if (applicableBundles.length > 0) {
      const bestBundle = applicableBundles[0];
      const discount = (lineTotal * Number(bestBundle.discountPercent)) / 100;
      totalSavings += discount;
    }
  }

  return Math.round(totalSavings * 100) / 100;
}

function bestBundleForQty(
  qty: number,
  bundles: Array<{ minQuantity: number; discountPercent: unknown }>,
) {
  if (!Array.isArray(bundles) || bundles.length === 0) return null;
  const applicable = bundles
    .filter((b) => qty >= b.minQuantity)
    .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));
  return applicable[0] ?? null;
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const [cart, user, globalBundles, translations] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getGlobalBundleOffers(),
    getTranslations(locale),
  ]);
  const t = createT(translations);

  const items = cart?.items ?? [];
  const currency = items[0]?.product?.currency ?? "EUR";
  const currencySymbol = currency === "EUR" ? "€" : currency;
  const formatMoney = (amount: number) => (Math.round(amount * 100) / 100).toFixed(2);

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
            id: item.product.id,
            bundleOffers: item.product.bundleOffers.map((b) => ({
              minQuantity: b.minQuantity,
              discountPercent: b.discountPercent,
            })),
          }
        : null,
    })),
    globalBundles.map((b) => ({
      minQuantity: b.minQuantity,
      discountPercent: b.discountPercent,
    })),
  );

  const prefix = `/${locale}`;

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
            <li className="font-medium text-gray-900" aria-current="page">
              {t("nav.cart")}
            </li>
          </ol>
        </nav>

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
            {t("cart.yourCart")}
          </h1>
          <Link
            href={`${prefix}/products`}
            className="text-sm font-medium uppercase tracking-wide text-gray-600 transition hover:text-black"
          >
            {t("cart.continueShopping")}
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              {t("cart.empty")}{" "}
              <Link href={`${prefix}/products`} className="font-medium text-black underline hover:no-underline">
                {t("cart.shop")}
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              {bundleSavings > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-[#606C38]/10 px-4 py-3 text-sm text-[#283618]">
                  <span className="text-[#BC6C25]">🎉</span>
                  <span className="font-medium">
                    {t("cart.bundleSavingsMessage", { currency, amount: bundleSavings.toFixed(2) })}
                  </span>
                </div>
              )}
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  quantity={item.quantity}
                  unitPrice={Number(item.unitPrice)}
                  currency={currency}
                  bundleLine={(() => {
                    const qty = item.quantity;
                    const unitPrice = Number(item.unitPrice);
                    const lineTotal = unitPrice * qty;
                    const productBundles = item.product?.bundleOffers ?? [];
                    const allBundles = [...productBundles, ...globalBundles];
                    const best = bestBundleForQty(qty, allBundles);
                    if (!best) return null;
                    const saved = (lineTotal * Number(best.discountPercent)) / 100;
                    if (!(saved > 0)) return null;
                    return t("cart.bundleDealLine", {
                      min: best.minQuantity,
                      currency: currencySymbol,
                      amount: formatMoney(saved),
                    });
                  })()}
                  product={
                    item.product
                      ? {
                          name: item.product.name,
                          image: item.product.images?.[0] ?? null,
                        }
                      : null
                  }
                />
              ))}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <CartOrderSummary
                subtotal={subtotal}
                currency={currency}
                showReminder={!user}
                bundleSavings={bundleSavings}
              />
            </div>
          </div>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
