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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/products"
          className="inline-flex text-base font-medium text-[#606C38] transition hover:text-[#BC6C25]"
        >
          ← Back to products
        </Link>
        <nav
          aria-label="Breadcrumb"
          className="mb-8 mt-2 text-sm font-medium uppercase tracking-wide text-[#606C38]"
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

        {/* Figma-style: two columns – image gallery (thumbnails + main), product shop */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
          {/* Left: product images – thumbnails then main image */}
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:gap-6">
            {product.images.length > 1 && (
              <div className="flex shrink-0 gap-4 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#606C38]/10 md:h-14 md:w-14"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.name}
                      fill
                      className="object-contain"
                      sizes="56px"
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
            <div className="relative aspect-square w-full max-h-[380px] max-w-[380px] overflow-hidden rounded-2xl bg-transparent sm:max-h-[450px] sm:max-w-[450px] md:max-h-[520px] md:max-w-[520px] lg:max-h-[550px] lg:max-w-[550px]">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 380px, (max-width: 768px) 450px, (max-width: 1024px) 520px, 550px"
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

          {/* Right: product shop – brand, name, short description, price, add to cart (Figma-style) */}
          <div className="flex min-w-0 flex-1 flex-col md:max-w-[420px] md:pl-2">
            {product.brand && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#606C38]">
                {product.brand}
              </p>
            )}
            <h1 className="mt-1.5 text-[28px] font-black leading-tight tracking-wide text-[#283618] sm:text-[32px]">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-3 line-clamp-3 text-[13.5px] leading-[1.5] text-[#283618]">
                {product.description}
              </p>
            )}
            {product.weight && (
              <p className="mt-1 text-sm font-medium text-[#606C38]">
                {product.weight}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-xl font-semibold text-[#BC6C25] sm:text-2xl">
                {product.currency} {price.toFixed(2)}
              </p>
              {!soldOut && (
                <span className="rounded-full bg-[#DDA15E]/30 px-2.5 py-0.5 text-xs font-medium text-[#BC6C25]">
                  {quantityLeft} in stock
                </span>
              )}
            </div>
            {product.origin && (
              <p className="mt-1 text-xs font-medium text-[#606C38]">
                Origin: {product.origin}
              </p>
            )}
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

            {!soldOut && (
              <AddToCartForm
                productId={product.id}
                productName={product.name}
                quantityLeft={quantityLeft}
                price={price}
                currency={product.currency}
              />
            )}

            <p className="mt-4 text-xs text-[#606C38]">
              Ships in 1–2 business days. Secure checkout with Stripe. Guest
              checkout supported.
            </p>
          </div>
        </div>

        {/* Description section – Figma-style grey block with brand, title, body */}
        <section className="mt-12 rounded-2xl bg-[#606C38]/[0.06] px-6 py-8 sm:px-8 md:mt-16">
          {product.brand && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#606C38]">
              {product.brand}
            </p>
          )}
          <h2 className="mt-2 text-3xl font-black tracking-wide text-[#283618] sm:text-4xl">
            {product.name}
          </h2>
          <div className="mt-6 max-w-2xl">
            <p className="whitespace-pre-line text-[15px] leading-[1.9] text-[#283618]">
              {product.description ?? "No description available."}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
