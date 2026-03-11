import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const rawSlug = (await params).slug;
  const slug = decodeURIComponent(rawSlug).trim();
  const user = await getCurrentUser();

  const [product, bundleOffers] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        variants: {
          include: { inventoryItems: true },
        },
      },
    }),
    prisma.bundleOffer.findMany({
      where: {
        active: true,
        OR: [{ productId: null }, { product: { slug } }],
      },
      orderBy: { discountPercent: "desc" },
    }),
  ]);

  if (!product || !product.active) {
    notFound();
  }

  const quantityLeft = product.variants.reduce(
    (sum, v) =>
      sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  const soldOut = quantityLeft <= 0;
  const primaryImage = product.images[0];
  const price = Number(product.price);

  const productBundles = bundleOffers.filter(
    (b) => b.productId === product.id || b.productId === null,
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href="/products"
          className="mb-6 inline-flex text-sm text-zinc-500 hover:text-emerald-600"
        >
          ← Back to products
        </Link>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-zinc-100 shadow-sm">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  No image
                </div>
              )}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                  <span className="rounded-full bg-zinc-800 px-6 py-3 text-base font-semibold text-white">
                    Sold out
                  </span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-zinc-100"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info & purchase */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                {product.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-xl font-semibold text-zinc-900">
                  {product.currency} {price.toFixed(2)}
                </p>
                {!soldOut && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    {quantityLeft} in stock
                  </span>
                )}
              </div>
              {productBundles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {productBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm"
                    >
                      <span className="text-amber-600">🏷️</span>
                      <span className="font-medium text-amber-800">
                        Buy {bundle.minQuantity}+ and save {Number(bundle.discountPercent)}%!
                      </span>
                      {bundle.description && (
                        <span className="text-amber-700">— {bundle.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {product.description && (
              <section className="rounded-xl border border-zinc-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-900">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">
                  {product.description}
                </p>
              </section>
            )}

            {!soldOut && (
              <form
                action="/api/cart/items"
                method="post"
                className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <input type="hidden" name="productId" value={product.id} />
                <div className="space-y-2">
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-semibold text-zinc-900"
                  >
                    How many do you want?
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    min={1}
                    max={quantityLeft}
                    defaultValue={1}
                    className="w-24 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium"
                  />
                  {quantityLeft < 10 && (
                    <p className="text-xs text-zinc-500">
                      Only {quantityLeft} left in stock
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-full border border-emerald-600 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Add to cart
                  </button>
                  <button
                    type="submit"
                    formAction="/api/cart/items?redirect=/checkout"
                    className="flex-1 rounded-full bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Buy now
                  </button>
                </div>
              </form>
            )}

            <p className="text-xs text-zinc-500">
              Ships in 1–2 business days. Secure checkout with Stripe. Guest
              checkout supported.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
