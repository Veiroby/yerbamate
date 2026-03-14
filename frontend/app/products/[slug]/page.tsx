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
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Link
          href="/products"
          className="mb-8 inline-flex text-sm font-medium text-gray-500 transition hover:text-amber-700"
        >
          ← Back to products
        </Link>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
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
                <div className="flex h-full items-center justify-center text-gray-400">
                  Product image
                </div>
              )}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                  <span className="rounded-full bg-[#0f172a] px-6 py-3 text-base font-semibold uppercase tracking-wide text-white">
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
                    className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
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
              <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 md:text-3xl">
                {product.name}
              </h1>
              {product.origin && (
                <p className="mt-1 text-sm text-gray-600">
                  Origin: <span className="font-medium">{product.origin}</span>
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-xl font-semibold text-gray-900">
                  €{price.toFixed(2)}
                </p>
                {!soldOut && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    {quantityLeft} in stock
                  </span>
                )}
              </div>
              {productBundles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {productBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
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
              <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
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

            <p className="text-xs text-gray-500">
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
