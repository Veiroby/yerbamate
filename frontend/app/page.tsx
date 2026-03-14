import { prisma } from "@/lib/db";
import { Navbar } from "@/app/components/landing/Navbar";
import { Hero } from "@/app/components/landing/Hero";
import { PromoBlock } from "@/app/components/landing/PromoBlock";
import { TrendingSection } from "@/app/components/landing/TrendingSection";
import {
  ProductCarouselSection,
  type CarouselProduct,
} from "@/app/components/landing/ProductCarouselSection";
import { BrandPartners } from "@/app/components/landing/BrandPartners";
import { FollowSubscribe } from "@/app/components/landing/FollowSubscribe";
import { Footer } from "@/app/components/landing/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  const carouselProducts: CarouselProduct[] = products.map((p) => ({
    title: p.name,
    price: `€${Number(p.price).toFixed(2)}`,
    href: `/products/${encodeURIComponent(p.slug)}`,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.altText ?? p.name,
  }));

  const firstProduct = products[0];
  const secondProduct = products[1];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main>
        <Hero />

        {/* Two promo blocks - row 1 */}
        <section className="grid md:grid-cols-2" aria-label="Featured categories">
          <PromoBlock
            title="Pure yerba mate"
            price="€19.99"
            href="/products?category=yerba-mate"
            imageUrl={firstProduct?.images[0]?.url ?? null}
            imageAlt={firstProduct?.name}
            backgroundColor="bg-violet-200"
          />
          <PromoBlock
            title="Best blends"
            price="€19.99"
            href="/products"
            imageUrl={secondProduct?.images[0]?.url ?? null}
            imageAlt={secondProduct?.name}
            backgroundColor="bg-emerald-200"
          />
        </section>

        <TrendingSection />

        <ProductCarouselSection title="New arrivals" products={carouselProducts.slice(0, 8)} />

        {/* Two promo blocks - row 2 */}
        <section className="grid md:grid-cols-2" aria-label="More categories">
          <PromoBlock
            title="Classic mate"
            price="€2.32"
            href="/products?category=mate-gourds"
            backgroundColor="bg-amber-600"
            textColor="text-white"
          />
          <PromoBlock
            title="Herbal blends"
            price="€19.99"
            href="/products"
            backgroundColor="bg-pink-200"
          />
        </section>

        <ProductCarouselSection title="Deals" products={carouselProducts.slice(0, 8)} />

        <BrandPartners />
        <FollowSubscribe />
      </main>

      <Footer />
    </div>
  );
}
