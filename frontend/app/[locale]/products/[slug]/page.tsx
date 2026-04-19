import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { AddToCartForm } from "@/app/products/[slug]/add-to-cart-form";
import { ProductReviewsSection } from "@/app/products/[slug]/product-reviews-section";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import type { Metadata } from "next";
import {
  isYerbaMateCategory,
  lvYerbaImageAlt,
  enYerbaImageAlt,
  productSeoDescription,
  productSeoTitle,
  lvYerbaDescriptionLead,
} from "@/lib/seo-yerba";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const baseUrl = "https://www.yerbatea.lv";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale: localeParam, slug: rawSlug } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as "lv" | "en";
  const slug = decodeURIComponent(rawSlug).trim();

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      active: true,
      archived: true,
      isDraft: true,
      descriptionEn: true,
      descriptionLv: true,
      description: true,
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true, altText: true } },
      currency: true,
      price: true,
    },
  });

  if (!product || !product.active || product.archived || product.isDraft) {
    return {
      title: "YerbaTea",
      description: "",
      alternates: {
        canonical: `${baseUrl}/${locale}/products/${encodeURIComponent(slug)}`,
        languages: {
          lv: `${baseUrl}/lv/products/${encodeURIComponent(slug)}`,
          en: `${baseUrl}/en/products/${encodeURIComponent(slug)}`,
        },
      },
    };
  }

  const localizedDescription =
    locale === "lv"
      ? product.descriptionLv ?? product.descriptionEn ?? product.description ?? null
      : product.descriptionEn ?? product.descriptionLv ?? product.description ?? null;

  const canonical = `${baseUrl}/${locale}/products/${encodeURIComponent(slug)}`;

  const primaryImage = product.images[0];
  const openGraphImageUrl =
    primaryImage?.url && primaryImage.url.startsWith("http")
      ? primaryImage.url
      : primaryImage?.url
        ? `${baseUrl}${primaryImage.url}`
        : undefined;

  const priceLabel =
    product.currency === "EUR"
      ? `€${Number(product.price).toFixed(2)}`
      : `${Number(product.price).toFixed(2)} ${product.currency}`;

  const title = productSeoTitle(locale, product.name, product.category?.slug);
  const description = productSeoDescription(
    locale,
    localizedDescription,
    product.name,
    product.category?.slug,
    priceLabel,
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv/products/${encodeURIComponent(slug)}`,
        en: `${baseUrl}/en/products/${encodeURIComponent(slug)}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: openGraphImageUrl ? [{ url: openGraphImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, slug: rawSlug } = await params;
  if (!isValidLocale(localeParam)) return null;
  const locale = localeParam;
  const slug = decodeURIComponent(rawSlug).trim();
  const user = await getCurrentUser();

  const [product, bundleOffers, reviews, translations] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true } },
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
    getTranslations(locale),
  ]);

  const t = createT(translations);

  if (!product || !product.active || product.archived || product.isDraft) {
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
      ? "get_in_5_7_days"
      : quantityLeft > 0
        ? "in_stock"
        : "get_in_5_7_days";
  const primaryImage = product.images[0];
  const price = Number(product.price);

  const localizedDescription =
    locale === "lv"
      ? product.descriptionLv ?? product.descriptionEn ?? product.description ?? null
      : product.descriptionEn ?? product.descriptionLv ?? product.description ?? null;

  const yerbaLead =
    locale === "lv" && isYerbaMateCategory(product.category?.slug)
      ? lvYerbaDescriptionLead(product.name, localizedDescription)
      : null;

  const primaryImageAlt =
    locale === "lv" && isYerbaMateCategory(product.category?.slug)
      ? lvYerbaImageAlt(product.name, primaryImage?.altText)
      : locale === "en" && isYerbaMateCategory(product.category?.slug)
        ? enYerbaImageAlt(product.name, primaryImage?.altText)
        : primaryImage?.altText ?? product.name;

  const thumbAlt = (alt: string | null | undefined) =>
    locale === "lv" && isYerbaMateCategory(product.category?.slug)
      ? lvYerbaImageAlt(product.name, alt)
      : locale === "en" && isYerbaMateCategory(product.category?.slug)
        ? enYerbaImageAlt(product.name, alt)
        : alt ?? product.name;

  const productBundles = bundleOffers.filter(
    (b) => b.productId === product.id || b.productId === null,
  );
  const currencySymbol = product.currency === "EUR" ? "€" : product.currency;
  const formatMoney = (amount: number) => (Math.round(amount * 100) / 100).toFixed(2);

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

  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: hasAdminAccess(user) } : null} locale={locale} />

      <main className="mx-auto w-full max-w-7xl px-3 py-8 max-lg:max-w-none sm:px-6 sm:py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <Link href={prefix} className="hover:text-black">{t("common.home")}</Link>
          <span className="mx-1">/</span>
          <Link href={`${prefix}/products`} className="hover:text-black">{t("product.shop")}</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="flex-1">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImageAlt}
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
                <div className="flex h-full items-center justify-center text-gray-400">{t("product.productImage")}</div>
              )}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white">{t("product.soldOut")}</span>
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
                      alt={thumbAlt(image.altText)}
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
                  {stockLabel === "in_stock" ? t("product.inStock") : t("product.getIn57Days")}
                  {stockLabel === "in_stock" && quantityLeft > 0 && quantityLeft <= 20 && ` (${quantityLeft})`}
                </span>
              )}
            </div>
            {product.weight && (
              <p className="mt-1 text-sm text-gray-500">{product.weight}</p>
            )}
            {product.origin && (
              <p className="mt-2 text-xs text-gray-500">{t("product.origin")}: {product.origin}</p>
            )}

            {productBundles.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t("product.offers")}</p>
                {productBundles.map((bundle) => (
                  (() => {
                    const percent = Number(bundle.discountPercent);
                    const qty = bundle.minQuantity;
                    const savings = (price * qty * percent) / 100;
                    return (
                  <div
                    key={bundle.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-black">
                      {t("product.buySaveExact", {
                        min: qty,
                        currency: currencySymbol,
                        amount: formatMoney(savings),
                      })}
                    </span>
                    {bundle.description && (
                      <span className="text-xs text-gray-500">{bundle.description}</span>
                    )}
                  </div>
                    );
                  })()
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
              {t("product.shipsIn12Days")}
            </p>
          </div>
        </div>

        <section className="mt-12 border-t border-gray-200 pt-10">
          <h2 className="text-lg font-bold uppercase tracking-wide text-black">{t("product.productDetails")}</h2>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
            {yerbaLead ? (
              <p className="mb-3 text-sm font-semibold leading-relaxed text-gray-900">{yerbaLead}</p>
            ) : null}
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {localizedDescription ?? t("product.noDescription")}
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
      <Footer locale={locale} />
    </div>
  );
}
