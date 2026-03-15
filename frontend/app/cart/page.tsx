import Link from "next/link";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { CartOrderSummary } from "@/app/cart/cart-order-summary";
import { CartItem } from "@/app/cart/cart-item";

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

export default async function CartPage() {
  const [cart, user, globalBundles] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getGlobalBundleOffers(),
  ]);

  const items = cart?.items ?? [];
  const currency = items[0]?.product?.currency ?? "EUR";

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

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1a1a1a]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="transition hover:text-gray-900">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-gray-900" aria-current="page">
              Cart
            </li>
          </ol>
        </nav>

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
            Your cart
          </h1>
          <Link
            href="/products"
            className="text-sm font-medium uppercase tracking-wide text-gray-600 transition hover:text-black"
          >
            Continue shopping
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              Your cart is empty. Start by adding some products from the{" "}
              <Link href="/products" className="font-medium text-black underline hover:no-underline">
                shop
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
                    You&apos;re saving {currency} {bundleSavings.toFixed(2)} with bundle discounts!
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
      <SiteFooter />
    </div>
  );
}

