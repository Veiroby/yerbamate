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
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="heading-page">Checkout</h1>
            <p className="mt-1 text-sm text-[#606C38]">
              Guest checkout is supported. You can create an account later.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-sm font-medium uppercase tracking-wide text-[#606C38] hover:text-[#BC6C25]"
          >
            Back to cart
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-8 text-center text-sm text-[#606C38]">
            Your cart is empty. Add items from the{" "}
            <Link href="/products" className="text-[#BC6C25] underline hover:text-[#BC6C25]/90">
              shop
            </Link>{" "}
            before checking out.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            <CheckoutForm
              currency={currency}
              subtotal={subtotal}
              discountCode={appliedDiscountCode}
            />

            <section className="space-y-3 rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#283618]">
                Order summary
              </h2>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#606C38]/10 aspect-square">
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
                        <p className="text-xs font-medium text-[#283618]">
                          {item.product?.name ?? "Product"}
                        </p>
                        <p className="text-[11px] text-[#606C38]">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-[#283618]">
                      {(item.unitPrice as unknown as number).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#606C38]">Subtotal</dt>
                  <dd className="font-medium text-[#283618]">
                    {currency} {subtotal.toFixed(2)}
                  </dd>
                </div>
                {appliedDiscountCode && discountAmount > 0 && (
                  <div className="flex justify-between text-[#BC6C25]">
                    <dt>Discount ({appliedDiscountCode})</dt>
                    <dd className="font-medium">
                      -{currency} {discountAmount.toFixed(2)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#606C38]">Shipping</dt>
                  <dd className="font-medium text-[#283618]">
                    {currency} {(shipping.amount ?? 0).toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#606C38]/20 pt-2">
                  <dt className="text-[#283618] font-medium">Estimated total</dt>
                  <dd className="text-base font-semibold text-[#283618]">
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

