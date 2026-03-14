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
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Link
          href="/products"
          className="inline-flex text-sm font-medium text-[#606C38] transition hover:text-[#BC6C25]"
        >
          ← Back to products
        </Link>
        <nav
          aria-label="Breadcrumb"
          className="mb-8 mt-2 text-xs font-medium uppercase tracking-wide text-[#606C38]"
        >
          <Link href="/" className="hover:text-[#BC6C25]">
            Home
          </Link>{" "}
          <span className="mx-1 text-[#606C38]/60">/</span>
          <Link href="/products" className="hover:text-[#BC6C25]">
            Products
          </Link>{" "}
          <span className="mx-1 text-[#606C38]/60">/</span>
          <span className="text-[#283618]">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Images: thumbnails on the left, large image on the right (Figma-style) */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-3 md:overflow-visible md:pb-0">
                  {product.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#606C38]/20 bg-transparent md:h-20 md:w-20"
                    >
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.name}
                        fill
                        className="object-contain"
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
              <div className="relative aspect-square w-full max-h-[320px] max-w-[320px] overflow-hidden rounded-lg bg-transparent sm:max-h-[380px] sm:max-w-[380px] md:max-h-[420px] md:max-w-[420px]">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.altText ?? product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 320px, (max-width: 768px) 380px, 420px"
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
                  <div className="flex h-full items-center justify-center text-[#606C38]/60">
                    Product image
                  </div>
                )}
                {soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#283618]/50">
                    <span className="rounded-full bg-[#283618] px-6 py-3 text-base font-semibold uppercase tracking-wide text-[#FEFAE0]">
                      Sold out
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info & purchase – text sizes balanced with image column */}
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide text-[#283618] sm:text-2xl md:text-[1.75rem]">
                {product.name}
              </h1>
              {product.origin && (
                <p className="mt-1 text-sm text-[#606C38]">
                  Origin: <span className="font-medium">{product.origin}</span>
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-[#283618] sm:text-xl">
                  €{price.toFixed(2)}
                </p>
                {!soldOut && (
                  <span className="rounded-full bg-[#DDA15E]/30 px-2.5 py-0.5 text-xs font-medium text-[#BC6C25]">
                    {quantityLeft} in stock
                  </span>
                )}
              </div>
              {productBundles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {productBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="flex items-center gap-2 rounded-lg border border-[#DDA15E]/50 bg-[#DDA15E]/20 px-3 py-2 text-sm"
                    >
                      <span className="text-[#BC6C25]">🏷️</span>
                      <span className="font-medium text-[#283618]">
                        Buy {bundle.minQuantity}+ and save {Number(bundle.discountPercent)}%!
                      </span>
                      {bundle.description && (
                        <span className="text-[#606C38]">— {bundle.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product description from product.description */}
            <section className="rounded-lg border border-[#606C38]/20 bg-[#FEFAE0] p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#606C38]">
                Description
              </h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-[#283618]">
                {product.description ?? "No description available."}
              </p>
            </section>

            {!soldOut && (
              <AddToCartForm 
                productId={product.id} 
                productName={product.name}
                quantityLeft={quantityLeft}
                price={price}
                currency={product.currency}
              />
            )}

            <p className="text-xs text-[#606C38]">
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
