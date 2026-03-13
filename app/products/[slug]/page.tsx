import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { AddToCartForm } from "./add-to-cart-form";

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
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href="/products"
          className="mb-6 inline-flex text-sm text-stone-500 hover:text-teal-600 transition"
        >
          ← Back to products
        </Link>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                  unoptimized
                  style={{
                    objectPosition: `${Math.round(primaryImage.focalX * 100)}% ${Math.round(
                      primaryImage.focalY * 100,
                    )}%`,
                    transform:
                      typeof (primaryImage as any).zoom === "number" &&
                      (primaryImage as any).zoom !== 1
                        ? `scale(${(primaryImage as any).zoom})`
                        : undefined,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-400">
                  No image
                </div>
              )}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-900/50">
                  <span className="rounded-full bg-stone-800 px-6 py-3 text-base font-semibold text-white">
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
                    className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                      style={{
                        objectPosition: `${Math.round(image.focalX * 100)}% ${Math.round(
                          image.focalY * 100,
                        )}%`,
                        transform:
                          typeof (image as any).zoom === "number" &&
                          (image as any).zoom !== 1
                            ? `scale(${(image as any).zoom})`
                            : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info & purchase */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                {product.name}
              </h1>
              {product.origin && (
                <p className="mt-1 text-sm text-stone-600">
                  Origin: <span className="font-medium">{product.origin}</span>
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-xl font-semibold text-stone-900">
                  €{price.toFixed(2)}
                </p>
                {!soldOut && (
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
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
              <section className="rounded-xl border border-stone-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-stone-900">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">
                  {product.description}
                </p>
              </section>
            )}

            {!soldOut && (
              <AddToCartForm 
                productId={product.id} 
                productName={product.name}
                quantityLeft={quantityLeft}
                price={price}
                currency={product.currency}
              />
            )}

            <p className="text-xs text-stone-500">
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
