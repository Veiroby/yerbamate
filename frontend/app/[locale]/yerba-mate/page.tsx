import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { ProductCard } from "@/app/components/product-card";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import { YERBA_MATE_CATEGORY_SLUG } from "@/lib/seo-yerba";
import { categorySlugIncludingAdminDuplicates } from "@/lib/category-filters";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const translations = await getTranslations(locale as "lv" | "en");
  const t = createT(translations);
  const category = t("products.categoryYerbaMate");

  return {
    title: `${category} | YerbaTea`,
    description:
      locale === "lv"
        ? t("products.seoDescriptionYerbaCategoryPageLv")
        : t("products.seoDescriptionYerbaCategoryPageEn"),
  };
}

function stockRank(stockLocation: string | null | undefined, quantityLeft: number) {
  if (stockLocation === "warehouse") return 2;
  if (quantityLeft > 0) return 0;
  return 1;
}

export default async function YerbaMatePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const [user, translations, products] = await Promise.all([
    getCurrentUser(),
    getTranslations(locale),
    prisma.product.findMany({
      where: {
        active: true,
        archived: false,
        isDraft: false,
        category: categorySlugIncludingAdminDuplicates("yerba-mate"),
      },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { include: { inventoryItems: true } },
      },
    }),
  ]);

  const t = createT(translations);
  const prefix = `/${locale}`;

  const productCards = products
    .map((p) => {
      const quantityLeft = p.variants.reduce(
        (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
        0,
      );
      const location = p.stockLocation ?? "instock";
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
        categorySlug: YERBA_MATE_CATEGORY_SLUG,
        quantityLeft,
        stockLocation: location,
        description: localizedDescription,
        brand: p.brand,
        origin: p.origin,
        weight: p.weight ?? null,
      };
    })
    .sort((a, b) => {
      const r = stockRank(a.stockLocation, a.quantityLeft) - stockRank(b.stockLocation, b.quantityLeft);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: hasAdminAccess(user) } : null} locale={locale} />
      <main className="mx-auto w-full max-w-7xl px-3 py-10 max-lg:max-w-none sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-10 border-b border-gray-200 pb-8">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl md:text-4xl">
            {t("products.categoryYerbaMate")}
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {t("products.browseCategorySelection", { category: t("products.categoryYerbaMate") })}
          </p>
        </header>

        <p className="mb-6 text-base font-medium text-gray-600">
          {productCards.length === 1
            ? t("products.showingCount", { count: productCards.length })
            : t("products.showingCountPlural", { count: productCards.length })}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {productCards.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

