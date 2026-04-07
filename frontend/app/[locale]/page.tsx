import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Hero } from "@/app/components/landing/Hero";
import {
  ProductCarouselSection,
  type CarouselProduct,
} from "@/app/components/landing/ProductCarouselSection";
import { BrandPartners } from "@/app/components/landing/BrandPartners";
import { MateGuideSection } from "@/app/components/landing/MateGuideSection";
import { FollowSubscribe } from "@/app/components/landing/FollowSubscribe";
import { Footer } from "@/app/components/landing/Footer";
import { TestimonialsSection, type Testimonial } from "@/app/components/landing/TestimonialsSection";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { getTranslations, createT, isValidLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function productQuantityLeft(p: {
  variants: { inventoryItems: { quantity: number }[] }[];
}): number {
  return p.variants.reduce(
    (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );
}

function toCarouselProduct(
  p: {
    id: string;
    name: string;
    price: unknown;
    slug: string;
    images: { url: string; altText: string | null }[];
    weight: string | null;
    stockLocation: string | null;
    variants: { inventoryItems: { quantity: number }[] }[];
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
    quantityLeft: productQuantityLeft(p),
  };
}

type Props = { params: Promise<{ locale: string }> };

const baseUrl = "https://www.yerbatea.lv";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as Locale;

  const title =
    locale === "lv"
      ? "YerbaTea – Premium yerba mate un mate trauciņi"
      : "YerbaTea – Premium Yerba Mate & Mate Gourds";

  const description =
    locale === "lv"
      ? "Premium yerba mate un mate trauciņi, piegādāti līdz jūsu durvīm."
      : "Premium yerba mate and mate gourds, delivered to your door.";

  const canonical = `${baseUrl}/${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv`,
        en: `${baseUrl}/en`,
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

export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = (localeParam === "lv" || localeParam === "en" ? localeParam : "lv") as Locale;

  const [user, settings, latestProducts, heroStats, translations, testimonials] = await Promise.all([
    getCurrentUser(),
    prisma.siteSettings.findUnique({
      where: { id: "default" },
    }),
    prisma.product.findMany({
      where: { active: true, archived: false },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { include: { inventoryItems: true } },
      },
    }),
    (async () => {
      const [productCount, brands, subscriberEmails, userEmails] = await Promise.all([
        prisma.product.count({ where: { active: true, archived: false } }),
        prisma.product.findMany({
          where: { active: true, archived: false, brand: { not: null } },
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
                include: {
                  images: { orderBy: { position: "asc" }, take: 1 },
                  variants: { include: { inventoryItems: true } },
                },
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
                include: {
                  images: { orderBy: { position: "asc" }, take: 1 },
                  variants: { include: { inventoryItems: true } },
                },
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

        <ProductCarouselSection
          titleKey="home.newArrivals"
          products={newArrivalsCarousel}
          compactTop
        />

        <ProductCarouselSection
          titleKey="home.topSelling"
          descriptionKey="home.topSellingDescription"
          products={topSellingCarousel}
        />

        <MateGuideSection locale={locale} />

        <TestimonialsSection testimonials={testimonials as unknown as Testimonial[]} />

        <BrandPartners />

        <FollowSubscribe />
      </main>

      <Footer locale={locale} />
    </div>
  );
}
