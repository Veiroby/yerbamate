import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/app/components/product-card";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isValidLocale(params.locale)) return {};

  const translations = await getTranslations(params.locale as "lv" | "en");
  const t = createT(translations);
  const category = t("products.categoryMateGourds");

  return {
    title: `${category} – YerbaTea`,
    description: t("products.browseCategorySelection", { category }),
  };
}

function stockRank(stockLocation: string | null | undefined, quantityLeft: number) {
  if (stockLocation === "warehouse") return 2;
  if (quantityLeft > 0) return 0;
  return 1;
}

export default async function MateGourdsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const [user, translations, products] = await Promise.all([
    getCurrentUser(),
    getTranslations(locale),
    prisma.product.findMany({
      where: { active: true, archived: false, category: { slug: "mate-gourds" } },
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
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto w-full max-w-7xl px-3 py-10 max-lg:max-w-none sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl md:text-4xl">
              {t("products.categoryMateGourds")}
            </h1>
            <p className="mt-2 text-base text-gray-600">{t("products.browseCategorySelection", { category: t("products.categoryMateGourds") })}</p>
          </div>
          <Link
            href={`${prefix}/cart`}
            className="inline-flex shrink-0 rounded border-2 border-black px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
          >
            {t("products.viewCart")}
          </Link>
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

