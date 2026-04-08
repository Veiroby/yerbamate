import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/app/components/product-card";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { ProductFilters, ActiveFilters } from "@/app/components/product-filters";
import { Prisma } from "@/app/generated/prisma/client";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const CATEGORY_KEYS: Record<string, string> = {
  "yerba-mate": "products.categoryYerbaMate",
  "mate-gourds": "products.categoryMateGourds",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    origin?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

const baseUrl = "https://www.yerbatea.lv";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as "lv" | "en";

  const search = await searchParams;
  const { q, category } = search;

  const translations = await getTranslations(locale);
  const t = createT(translations);

  const categoryKey = category && CATEGORY_KEYS[category] ? CATEGORY_KEYS[category] : null;
  const categoryLabel = categoryKey ? t(categoryKey) : category ?? null;

  const title =
    q
      ? t("products.searchTitle", { q })
      : categoryLabel
        ? categoryLabel
        : t("products.allProducts");

  const description =
    categoryLabel
      ? t("products.browseCategorySelection", { category: categoryLabel })
      : q
        ? t("products.tryAdjustingFilters")
        : t("products.browseCatalog");

  const canonical = `${baseUrl}/${locale}/products`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv/products`,
        en: `${baseUrl}/en/products`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const search = await searchParams;

  const { q, category, brand, origin, minPrice, maxPrice, sort } = search;

  const where: Prisma.ProductWhereInput = {
    active: true,
    archived: false,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { origin: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (brand) {
    where.brand = brand;
  }

  if (origin) {
    where.origin = origin;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice);
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "name-asc":
      orderBy = { name: "asc" };
      break;
    case "name-desc":
      orderBy = { name: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
  }

  const [products, categories, allProducts, translations] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { include: { inventoryItems: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { active: true, archived: false },
      select: { brand: true, origin: true, price: true },
    }),
    getTranslations(locale),
  ]);
  const t = createT(translations);

  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))] as string[];
  const origins = [...new Set(allProducts.map((p) => p.origin).filter(Boolean))] as string[];
  const prices = allProducts.map((p) => Number(p.price));
  const priceRange = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 100,
  };

  const filterOptions = {
    categories,
    brands: brands.sort(),
    origins: origins.sort(),
    priceRange,
  };

  const categoryLabel = category && CATEGORY_KEYS[category] ? t(CATEGORY_KEYS[category]) : category ?? null;

  const stockRank = (location: string | null | undefined, quantityLeft: number) => {
    // Instock with quantity first, then instock sold-out, then warehouse last.
    if (location === "warehouse") return 2;
    if (quantityLeft > 0) return 0;
    return 1;
  };

  const productCardsUnsorted = products.map((p) => {
    const quantityLeft = p.variants.reduce(
      (sum, v) =>
        sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
      0,
    );
    const location = p.stockLocation ?? "instock";
    const stockStatus =
      location === "warehouse"
        ? "get_in_5_7_days"
        : quantityLeft > 0
          ? "in_stock"
          : "get_in_5_7_days";
    const img = p.images[0];

    const localizedDescription =
      locale === "lv"
        ? p.descriptionLv ?? p.descriptionEn ?? p.description ?? null
        : p.descriptionEn ?? p.descriptionLv ?? p.description ?? null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      imageUrl: img?.url ?? null,
      imageAlt: img?.altText ?? null,
      quantityLeft,
      stockStatus,
      stockLocation: location,
      description: localizedDescription,
      brand: p.brand,
      origin: p.origin,
      weight: p.weight ?? null,
    };
  });

  const productCards = productCardsUnsorted
    .map((c, idx) => ({
      c,
      idx,
      rank: stockRank(c.stockLocation, c.quantityLeft),
    }))
    .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
    .map((x) => x.c);

  const getPageTitle = () => {
    if (q) return t("products.searchTitle", { q });
    if (categoryLabel) return categoryLabel;
    return t("products.allProducts");
  };

  const getPageDescription = () => {
    if (q) return t("products.resultsFound", { count: products.length });
    if (categoryLabel) return t("products.browseCategorySelection", { category: categoryLabel });
    return t("products.browseCatalog");
  };

  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto w-full max-w-7xl px-3 py-10 max-lg:max-w-none sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl md:text-4xl">
              {getPageTitle()}
            </h1>
            <p className="mt-2 text-base text-gray-600">
              {getPageDescription()}
            </p>
          </div>
          <Link
            href={`${prefix}/cart`}
            className="inline-flex shrink-0 rounded border-2 border-black px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
          >
            {t("products.viewCart")}
          </Link>
        </header>

        <ProductFilters options={filterOptions} />

        <ActiveFilters />

        <div className="mt-8">
          {productCards.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
              <svg
                className="mx-auto h-14 w-14 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-6 text-xl font-bold uppercase tracking-wide text-black">
                {t("products.noProductsFound")}
              </h3>
              <p className="mt-3 text-base text-gray-600">
                {t("products.tryAdjustingFilters")}
              </p>
              <Link
                href={`${prefix}/products`}
                className="mt-8 inline-flex rounded border-2 border-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
              >
                {t("products.clearAllFilters")}
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-base font-medium text-gray-600">
                {productCards.length === 1
                  ? t("products.showingCount", { count: productCards.length })
                  : t("products.showingCountPlural", { count: productCards.length })}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {productCards.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showDescription
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
