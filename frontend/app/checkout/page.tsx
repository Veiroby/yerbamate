import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateShippingForOrder } from "@/lib/shipping/service";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { CheckoutForm } from "./checkout-form";

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
            },
          },
          variant: true,
        },
      },
    },
  });
}

type CheckoutPageProps = {
  searchParams: Promise<{ discountCode?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { discountCode } = await searchParams;
  const [cart, user] = await Promise.all([getCartWithItems(), getCurrentUser()]);
  const items = cart?.items ?? [];

  const subtotal = items.reduce((sum, item) => {
    const price = item.unitPrice as unknown as number;
    return sum + price * item.quantity;
  }, 0);

  const destination = { country: "LV" };
  const shipping = await calculateShippingForOrder(
    destination,
    cart,
    null,
    subtotal,
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

  const estimatedTotal = subtotal - discountAmount + shipping.amount;
  const currency = items[0]?.product?.currency ?? "EUR";

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1a1a1a]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="transition hover:text-gray-900">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/cart" className="transition hover:text-gray-900">
                Cart
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-gray-900" aria-current="page">
              Checkout
            </li>
          </ol>
        </nav>

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Guest checkout is supported. You can create an account later.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-sm font-medium uppercase tracking-wide text-gray-600 transition hover:text-black"
          >
            Back to cart
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              Your cart is empty. Add items from the{" "}
              <Link href="/products" className="font-medium text-black underline hover:no-underline">
                shop
              </Link>{" "}
              before checking out.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <CheckoutForm
              currency={currency}
              subtotal={subtotal}
              discountCode={appliedDiscountCode}
            />

            <div className="lg:sticky lg:top-6 lg:self-start">
              <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-black">Order summary</h2>
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
                            {item.product?.name ?? "Product"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty {item.quantity}
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
                    <dt className="text-gray-500">Subtotal</dt>
                    <dd className="font-medium text-black">
                      {currency} {subtotal.toFixed(2)}
                    </dd>
                  </div>
                  {appliedDiscountCode && discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <dt>Discount ({appliedDiscountCode})</dt>
                      <dd className="font-medium">
                        -{currency} {discountAmount.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Shipping</dt>
                    <dd className="font-medium text-black">
                      {currency} {(shipping.amount ?? 0).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <dt className="font-bold text-black">Estimated total</dt>
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
      <SiteFooter />
    </div>
  );
}

