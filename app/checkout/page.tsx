import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateShippingForOrder } from "@/lib/shipping/service";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { CheckoutShippingBlock } from "./checkout-shipping-block";

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

export default async function CheckoutPage() {
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

  const estimatedTotal = subtotal + shipping.amount;
  const currency = items[0]?.product?.currency ?? "EUR";

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Guest checkout is supported. You can create an account later.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-sm font-medium text-zinc-600 hover:text-emerald-700"
          >
            Back to cart
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-zinc-500">
            Your cart is empty. Add items from the{" "}
            <Link href="/products" className="text-emerald-700 underline">
              shop
            </Link>{" "}
            before checking out.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            <form
              action="/api/stripe/checkout"
              method="post"
              className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm"
            >
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Contact
                </h2>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-600">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              </section>

              <CheckoutShippingBlock
                currency={currency}
                subtotal={subtotal}
              />

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Pay securely with Stripe
              </button>

              <p className="text-xs text-zinc-500">
                You will be redirected to a secure Stripe Checkout page to
                complete your payment.
              </p>
            </form>

            <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">
                Order summary
              </h2>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-100 aspect-square">
                        {item.product?.images?.[0] ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].altText ?? item.product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-900">
                          {item.product?.name ?? "Product"}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-zinc-900">
                      {(item.unitPrice as unknown as number).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Subtotal</dt>
                  <dd className="font-medium">
                    {currency} {subtotal.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Shipping</dt>
                  <dd className="font-medium">
                    {currency} {(shipping.amount ?? 0).toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="text-zinc-800">Estimated total</dt>
                  <dd className="text-base font-semibold text-zinc-900">
                    {currency} {estimatedTotal.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

