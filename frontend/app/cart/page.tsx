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
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="heading-page">Your cart</h1>
          <Link
            href="/products"
            className="text-sm font-medium uppercase tracking-wide text-[#606C38] transition hover:text-[#BC6C25]"
          >
            Continue shopping
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-8 text-center text-sm text-[#606C38]">
            Your cart is empty. Start by adding some products from the{" "}
            <Link href="/products" className="text-[#BC6C25] underline hover:text-[#BC6C25]/90">
              shop
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              {bundleSavings > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-[#606C38]/15 px-4 py-3 text-sm text-[#283618]">
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

            <CartOrderSummary
              subtotal={subtotal}
              currency={currency}
              showReminder={!user}
              bundleSavings={bundleSavings}
            />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

