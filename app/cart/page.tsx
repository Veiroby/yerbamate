import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { CartReminder } from "@/app/components/cart-reminder";
import { SiteFooter } from "@/app/components/site-footer";
import { CartShippingPreview } from "@/app/cart/cart-shipping-preview";

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
            },
          },
          variant: true,
        },
      },
    },
  });
}

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

  const items = cart?.items ?? [];

  const subtotal = items.reduce((sum, item) => {
    const price = item.unitPrice as unknown as number;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
          <Link
            href="/products"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Continue shopping
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-zinc-500">
            Your cart is empty. Start by adding some products from the{" "}
            <Link href="/products" className="text-emerald-700 underline">
              shop
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-4"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 aspect-square">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.images[0].altText ?? item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {item.product?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium text-zinc-900">
                    {(item.unitPrice as unknown as number).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-900">
                Order summary
              </h2>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Subtotal</dt>
                  <dd className="font-medium">
                    {items[0]?.product?.currency ?? "USD"}{" "}
                    {subtotal.toFixed(2)}
                  </dd>
                </div>
                <div className="border-t border-zinc-100 pt-3">
                  <CartShippingPreview
                    subtotal={subtotal}
                    currency={items[0]?.product?.currency ?? "EUR"}
                  />
                </div>
              </dl>

              <form action="/checkout" method="get" className="pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Checkout
                </button>
              </form>

              <p className="text-xs text-zinc-500">
                You can checkout as a guest or create an account during
                checkout.
              </p>
              {!user && (
                <div className="border-t border-zinc-100 pt-3">
                  <p className="mb-2 text-xs font-medium text-zinc-700">
                    Get a reminder
                  </p>
                  <CartReminder />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

