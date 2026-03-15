import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { AddToCartForm } from "./add-to-cart-form";
import { ProductReviewsSection } from "./product-reviews-section";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const rawSlug = (await params).slug;
  const slug = decodeURIComponent(rawSlug).trim();
  const user = await getCurrentUser();

  const [product, bundleOffers, reviews] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { include: { inventoryItems: true } },
      },
    }),
    prisma.bundleOffer.findMany({
      where: {
        active: true,
        OR: [{ productId: null }, { product: { slug } }],
      },
      orderBy: { discountPercent: "desc" },
    }),
    prisma.review.findMany({
      where: { product: { slug }, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
      },
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
  const stockLocation = product.stockLocation ?? "instock";
  const soldOut = stockLocation !== "warehouse" && quantityLeft <= 0;
  const stockLabel =
    stockLocation === "warehouse"
      ? "Get in 5–7 days"
      : quantityLeft > 0
        ? "In stock"
        : "Get in 5–7 days";
  const primaryImage = product.images[0];
  const price = Number(product.price);

  const productBundles = bundleOffers.filter(
    (b) => b.productId === product.id || b.productId === null,
  );

  const reviewList = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName ?? "Anonymous",
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  }));
  const reviewAverage =
    reviewList.length > 0
      ? Math.round((reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length) * 10) / 10
      : null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-black">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/products" className="hover:text-black">Shop</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Left: image gallery – main image + thumbnails below (Figma style) */}
          <div className="flex-1">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  unoptimized
                  style={{
                    objectPosition: `${Math.round(primaryImage.focalX * 100)}% ${Math.round(primaryImage.focalY * 100)}%`,
                    transform: typeof (primaryImage as any).zoom === "number" && (primaryImage as any).zoom !== 1 ? `scale(${(primaryImage as any).zoom})` : undefined,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">Product image</div>
              )}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white">Sold out</span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: product details – title, price, description, quantity, Add to cart + Buy now (no color option) */}
          <div className="lg:max-w-[420px] lg:flex-shrink-0">
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{product.brand}</p>
            )}
            <h1 className="mt-1 text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-xl font-semibold text-black">{product.currency} {price.toFixed(2)}</p>
              {!soldOut && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {stockLabel}
                  {stockLabel === "In stock" && quantityLeft > 0 && quantityLeft <= 20 && ` (${quantityLeft})`}
                </span>
              )}
            </div>
            {product.weight && (
              <p className="mt-1 text-sm text-gray-500">{product.weight}</p>
            )}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            )}
            {product.origin && (
              <p className="mt-2 text-xs text-gray-500">Origin: {product.origin}</p>
            )}

            {/* Bundle offers – Figma “You might also like” card style */}
            {productBundles.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Offers</p>
                {productBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      Buy {bundle.minQuantity}+ — save {Number(bundle.discountPercent)}%
                    </span>
                    {bundle.description && (
                      <span className="text-xs text-gray-500">{bundle.description}</span>
                    )}
                  </div>
                ))}
              </div>
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

            <p className="mt-6 text-xs text-gray-500">
              Ships in 1–2 business days. Secure checkout with Stripe. Guest checkout supported.
            </p>
          </div>
        </div>

        {/* Product details section */}
        <section className="mt-12 border-t border-gray-200 pt-10">
          <h2 className="text-lg font-bold uppercase tracking-wide text-black">Product details</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {product.description ?? "No description available."}
            </p>
          </div>
        </section>

        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          initialReviews={reviewList}
          initialAverage={reviewAverage}
          initialCount={reviewList.length}
          defaultAuthorEmail={user?.email}
          defaultAuthorName={user?.name}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
