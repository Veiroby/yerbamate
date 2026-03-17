import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Hero } from "@/app/components/landing/Hero";
import { PromoBlock } from "@/app/components/landing/PromoBlock";
import { TrendingSection } from "@/app/components/landing/TrendingSection";
import {
  ProductCarouselSection,
  type CarouselProduct,
} from "@/app/components/landing/ProductCarouselSection";
import { BrandPartners } from "@/app/components/landing/BrandPartners";
import { BrowseByCategory } from "@/app/components/landing/BrowseByCategory";
import { FollowSubscribe } from "@/app/components/landing/FollowSubscribe";
import { Footer } from "@/app/components/landing/Footer";
import { TestimonialsSection, type Testimonial } from "@/app/components/landing/TestimonialsSection";
import type { Locale } from "@/lib/i18n";
import { getTranslations, createT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function toCarouselProduct(
  p: {
    id: string;
    name: string;
    price: unknown;
    slug: string;
    images: { url: string; altText: string | null }[];
    weight: string | null;
    stockLocation: string | null;
  },
  locale: Locale
): CarouselProduct {
  return {
    title: p.name,
    price: `€${Number(p.price).toFixed(2)}`,
    href: `/${locale}/products/${encodeURIComponent(p.slug)}`,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
    weight: p.weight ?? null,
    productId: p.id,
    stockLocation: p.stockLocation ?? null,
  };
}

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = (localeParam === "lv" || localeParam === "en" ? localeParam : "lv") as Locale;

  const [user, settings, latestProducts, heroStats, translations, testimonials] = await Promise.all([
    getCurrentUser(),
    prisma.siteSettings.findUnique({
      where: { id: "default" },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    (async () => {
      const [productCount, brands, customerEmails] = await Promise.all([
        prisma.product.count({ where: { active: true } }),
        prisma.product.findMany({
          where: { active: true, brand: { not: null } },
          select: { brand: true },
        }),
        prisma.order.findMany({ select: { email: true } }),
      ]);
      const brandCount = new Set(brands.map((b) => b.brand).filter(Boolean)).size;
      const customerCount = new Set(customerEmails.map((o) => o.email)).size;
      return { productCount, brandCount, customerCount };
    })(),
    getTranslations(locale),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 18,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        authorName: true,
      },
    }),
  ]);
  const t = createT(translations);

  const newArrivalsCollectionId = settings?.homeNewArrivalsCollectionId ?? null;
  const topSellingCollectionId = settings?.homeTopSellingCollectionId ?? null;
  const promoIds = settings?.homePromoProductIds ?? [];

  const [newArrivalsProducts, topSellingProducts, promoProducts] = await Promise.all([
    newArrivalsCollectionId
      ? prisma.productInCollection
          .findMany({
            where: { collectionId: newArrivalsCollectionId },
            orderBy: { position: "asc" },
            take: 8,
            include: {
              product: {
                include: { images: { orderBy: { position: "asc" }, take: 1 } },
              },
            },
          })
          .then((rows) => rows.map((r) => r.product))
      : Promise.resolve(latestProducts.slice(0, 8)),
    topSellingCollectionId
      ? prisma.productInCollection
          .findMany({
            where: { collectionId: topSellingCollectionId },
            orderBy: { position: "asc" },
            take: 8,
            include: {
              product: {
                include: { images: { orderBy: { position: "asc" }, take: 1 } },
              },
            },
          })
          .then((rows) => rows.map((r) => r.product))
      : Promise.resolve(latestProducts.slice(0, 8)),
    promoIds.length > 0
      ? prisma.product
          .findMany({
            where: { id: { in: promoIds }, active: true },
            include: { images: { orderBy: { position: "asc" }, take: 1 } },
          })
          .then((list) => {
            const byId = new Map(list.map((p) => [p.id, p]));
            return promoIds.map((id) => byId.get(id)).filter(Boolean) as typeof list;
          })
      : Promise.resolve([]),
  ]);

  const newArrivalsCarousel: CarouselProduct[] = newArrivalsProducts.map((p) =>
    toCarouselProduct(p, locale)
  );
  const topSellingCarousel: CarouselProduct[] = topSellingProducts.map((p) =>
    toCarouselProduct(p, locale)
  );

  const promoBlocks = [
    promoProducts[0] ?? latestProducts[0],
    promoProducts[1] ?? latestProducts[1],
    promoProducts[2] ?? latestProducts[2],
    promoProducts[3] ?? latestProducts[3],
  ];
  const firstProduct = promoBlocks[0];
  const secondProduct = promoBlocks[1];
  const thirdProduct = promoBlocks[2];
  const fourthProduct = promoBlocks[3];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />

      <main>
        <Hero
          productCount={heroStats.productCount}
          brandCount={heroStats.brandCount}
          customerCount={heroStats.customerCount}
        />

        <section className="grid md:grid-cols-2" aria-label="Featured products">
          <PromoBlock
            title={firstProduct?.name ?? t("home.pureYerbaMate")}
            price={firstProduct ? `€${Number(firstProduct.price).toFixed(2)}` : "€19.99"}
            href={
              firstProduct
                ? `/${locale}/products/${encodeURIComponent(firstProduct.slug)}`
                : `/${locale}/products?category=yerba-mate`
            }
            imageUrl={firstProduct?.images[0]?.url ?? null}
            imageAlt={firstProduct?.name}
            description={firstProduct?.description ?? null}
            weight={firstProduct?.weight ?? null}
            backgroundColor="bg-gray-100"
            productId={firstProduct?.id}
            productSlug={firstProduct?.slug}
          />
          <PromoBlock
            title={secondProduct?.name ?? t("home.bestBlends")}
            price={secondProduct ? `€${Number(secondProduct.price).toFixed(2)}` : "€19.99"}
            href={
              secondProduct
                ? `/${locale}/products/${encodeURIComponent(secondProduct.slug)}`
                : `/${locale}/products`
            }
            imageUrl={secondProduct?.images[0]?.url ?? null}
            imageAlt={secondProduct?.name}
            description={secondProduct?.description ?? null}
            weight={secondProduct?.weight ?? null}
            backgroundColor="bg-gray-50"
            productId={secondProduct?.id}
            productSlug={secondProduct?.slug}
          />
        </section>

        <TrendingSection />

        <ProductCarouselSection titleKey="home.newArrivals" products={newArrivalsCarousel} />

        <section className="grid md:grid-cols-2" aria-label="More products">
          <PromoBlock
            title={thirdProduct?.name ?? t("home.classicMate")}
            price={thirdProduct ? `€${Number(thirdProduct.price).toFixed(2)}` : "€2.32"}
            href={
              thirdProduct
                ? `/${locale}/products/${encodeURIComponent(thirdProduct.slug)}`
                : `/${locale}/products?category=mate-gourds`
            }
            imageUrl={thirdProduct?.images[0]?.url ?? null}
            imageAlt={thirdProduct?.name}
            description={thirdProduct?.description ?? null}
            weight={thirdProduct?.weight ?? null}
            backgroundColor="bg-gray-200"
            productId={thirdProduct?.id}
            productSlug={thirdProduct?.slug}
          />
          <PromoBlock
            title={fourthProduct?.name ?? t("home.herbalBlends")}
            price={fourthProduct ? `€${Number(fourthProduct.price).toFixed(2)}` : "€19.99"}
            href={
              fourthProduct
                ? `/${locale}/products/${encodeURIComponent(fourthProduct.slug)}`
                : `/${locale}/products`
            }
            imageUrl={fourthProduct?.images[0]?.url ?? null}
            imageAlt={fourthProduct?.name}
            description={fourthProduct?.description ?? null}
            weight={fourthProduct?.weight ?? null}
            backgroundColor="bg-gray-100"
            productId={fourthProduct?.id}
            productSlug={fourthProduct?.slug}
          />
        </section>

        <section aria-label={t("home.topSelling")}>
          <div className="bg-white px-4 pt-12 sm:pt-16">
            <div className="mx-auto max-w-6xl text-center">
              <h2 className="mb-2 text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl">
                {t("home.topSelling")}
              </h2>
              <p className="text-sm text-gray-600 sm:text-base">
                {t("home.topSellingDescription")}
              </p>
            </div>
          </div>
          <ProductCarouselSection products={topSellingCarousel} />
        </section>

        <BrowseByCategory locale={locale} />

        <TestimonialsSection testimonials={testimonials as unknown as Testimonial[]} />

        <BrandPartners />

        <FollowSubscribe />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
