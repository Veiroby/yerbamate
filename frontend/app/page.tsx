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
import { TestimonialsSection } from "@/app/components/landing/TestimonialsSection";

export const dynamic = "force-dynamic";

function toCarouselProduct(p: { name: string; price: unknown; slug: string; images: { url: string; altText: string | null }[]; weight: string | null }) {
  return {
    title: p.name,
    price: `€${Number(p.price).toFixed(2)}`,
    href: `/products/${encodeURIComponent(p.slug)}`,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
    weight: p.weight ?? null,
  };
}

export default async function Home() {
  const user = await getCurrentUser();
  const [settings, latestProducts, heroStats] = await Promise.all([
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
        prisma.product.findMany({ where: { active: true, brand: { not: null } }, select: { brand: true } }),
        prisma.order.findMany({ select: { email: true } }),
      ]);
      const brandCount = new Set(brands.map((b) => b.brand).filter(Boolean)).size;
      const customerCount = new Set(customerEmails.map((o) => o.email)).size;
      return { productCount, brandCount, customerCount };
    })(),
  ]);

  const newArrivalsCollectionId = settings?.homeNewArrivalsCollectionId ?? null;
  const topSellingCollectionId = settings?.homeTopSellingCollectionId ?? null;
  const promoIds = settings?.homePromoProductIds ?? [];

  const [newArrivalsProducts, topSellingProducts, promoProducts] = await Promise.all([
    newArrivalsCollectionId
      ? prisma.productInCollection.findMany({
          where: { collectionId: newArrivalsCollectionId },
          orderBy: { position: "asc" },
          take: 8,
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" }, take: 1 } },
            },
          },
        }).then((rows) => rows.map((r) => r.product))
      : Promise.resolve(latestProducts.slice(0, 8)),
    topSellingCollectionId
      ? prisma.productInCollection.findMany({
          where: { collectionId: topSellingCollectionId },
          orderBy: { position: "asc" },
          take: 8,
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" }, take: 1 } },
            },
          },
        }).then((rows) => rows.map((r) => r.product))
      : Promise.resolve(latestProducts.slice(0, 8)),
    promoIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: promoIds }, active: true },
          include: { images: { orderBy: { position: "asc" }, take: 1 } },
        }).then((list) => {
          const byId = new Map(list.map((p) => [p.id, p]));
          return promoIds.map((id) => byId.get(id)).filter(Boolean) as typeof list;
        })
      : Promise.resolve([]),
  ]);

  const newArrivalsCarousel: CarouselProduct[] = newArrivalsProducts.map(toCarouselProduct);
  const topSellingCarousel: CarouselProduct[] = topSellingProducts.map(toCarouselProduct);

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
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main>
        <Hero
          productCount={heroStats.productCount}
          brandCount={heroStats.brandCount}
          customerCount={heroStats.customerCount}
        />

        {/* Two promo blocks - row 1: product name as title, image left, Add to cart + Buy now */}
        <section className="grid md:grid-cols-2" aria-label="Featured products">
          <PromoBlock
            title={firstProduct?.name ?? "Pure yerba mate"}
            price={firstProduct ? `€${Number(firstProduct.price).toFixed(2)}` : "€19.99"}
            href={firstProduct ? `/products/${encodeURIComponent(firstProduct.slug)}` : "/products?category=yerba-mate"}
            imageUrl={firstProduct?.images[0]?.url ?? null}
            imageAlt={firstProduct?.name}
            description={firstProduct?.description ?? null}
            backgroundColor="bg-gray-100"
            productId={firstProduct?.id}
            productSlug={firstProduct?.slug}
          />
          <PromoBlock
            title={secondProduct?.name ?? "Best blends"}
            price={secondProduct ? `€${Number(secondProduct.price).toFixed(2)}` : "€19.99"}
            href={secondProduct ? `/products/${encodeURIComponent(secondProduct.slug)}` : "/products"}
            imageUrl={secondProduct?.images[0]?.url ?? null}
            imageAlt={secondProduct?.name}
            description={secondProduct?.description ?? null}
            backgroundColor="bg-gray-50"
            productId={secondProduct?.id}
            productSlug={secondProduct?.slug}
          />
        </section>

        <TrendingSection />

        <ProductCarouselSection title="New arrivals" products={newArrivalsCarousel} />

        {/* Two promo blocks - row 2: use 3rd and 4th product if available */}
        <section className="grid md:grid-cols-2" aria-label="More products">
          <PromoBlock
            title={thirdProduct?.name ?? "Classic mate"}
            price={thirdProduct ? `€${Number(thirdProduct.price).toFixed(2)}` : "€2.32"}
            href={thirdProduct ? `/products/${encodeURIComponent(thirdProduct.slug)}` : "/products?category=mate-gourds"}
            imageUrl={thirdProduct?.images[0]?.url ?? null}
            imageAlt={thirdProduct?.name}
            description={thirdProduct?.description ?? null}
            backgroundColor="bg-gray-200"
            productId={thirdProduct?.id}
            productSlug={thirdProduct?.slug}
          />
          <PromoBlock
            title={fourthProduct?.name ?? "Herbal blends"}
            price={fourthProduct ? `€${Number(fourthProduct.price).toFixed(2)}` : "€19.99"}
            href={fourthProduct ? `/products/${encodeURIComponent(fourthProduct.slug)}` : "/products"}
            imageUrl={fourthProduct?.images[0]?.url ?? null}
            imageAlt={fourthProduct?.name}
            description={fourthProduct?.description ?? null}
            backgroundColor="bg-gray-100"
            productId={fourthProduct?.id}
            productSlug={fourthProduct?.slug}
          />
        </section>

        <ProductCarouselSection title="Top selling" products={topSellingCarousel} />

        <BrowseByCategory />

        <TestimonialsSection />

        <BrandPartners />

        <FollowSubscribe />
      </main>

      <Footer />
    </div>
  );
}
