import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Hero } from "@/app/components/landing/Hero";
import { TrendingSection } from "@/app/components/landing/TrendingSection";
import {
  ProductCarouselSection,
  type CarouselProduct,
} from "@/app/components/landing/ProductCarouselSection";
import { BrandPartners } from "@/app/components/landing/BrandPartners";
import { MateGuideSection } from "@/app/components/landing/MateGuideSection";
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
      const [productCount, brands, subscriberEmails, userEmails] = await Promise.all([
        prisma.product.count({ where: { active: true } }),
        prisma.product.findMany({
          where: { active: true, brand: { not: null } },
          select: { brand: true },
        }),
        prisma.newsletterSubscriber.findMany({ select: { email: true } }),
        prisma.user.findMany({ select: { email: true } }),
      ]);
      const brandCount = new Set(brands.map((b) => b.brand).filter(Boolean)).size;
      const uniqueEmails = new Set<string>();
      for (const r of subscriberEmails) {
        const e = (r.email || "").trim().toLowerCase();
        if (e) uniqueEmails.add(e);
      }
      for (const r of userEmails) {
        const e = (r.email || "").trim().toLowerCase();
        if (e) uniqueEmails.add(e);
      }
      const customerCount = uniqueEmails.size;
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

  const [newArrivalsProducts, topSellingProducts] = await Promise.all([
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
  ]);

  const newArrivalsCarousel: CarouselProduct[] = newArrivalsProducts.map((p) =>
    toCarouselProduct(p, locale)
  );
  const topSellingCarousel: CarouselProduct[] = topSellingProducts.map((p) =>
    toCarouselProduct(p, locale)
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />

      <main>
        <Hero
          productCount={heroStats.productCount}
          brandCount={heroStats.brandCount}
          customerCount={heroStats.customerCount}
        />

        <ProductCarouselSection titleKey="home.newArrivals" products={newArrivalsCarousel} />

        <TrendingSection />

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

        <MateGuideSection locale={locale} />

        <TestimonialsSection testimonials={testimonials as unknown as Testimonial[]} />

        <BrandPartners />

        <FollowSubscribe />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
