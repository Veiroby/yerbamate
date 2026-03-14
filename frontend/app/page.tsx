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

export default async function Home() {
  const user = await getCurrentUser();
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
    weight: p.weight ?? null,
  }));

  const firstProduct = products[0];
  const secondProduct = products[1];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main>
        <Hero />

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

        <ProductCarouselSection title="New arrivals" products={carouselProducts.slice(0, 8)} />

        {/* Two promo blocks - row 2: use 3rd and 4th product if available */}
        <section className="grid md:grid-cols-2" aria-label="More products">
          <PromoBlock
            title={products[2]?.name ?? "Classic mate"}
            price={products[2] ? `€${Number(products[2].price).toFixed(2)}` : "€2.32"}
            href={products[2] ? `/products/${encodeURIComponent(products[2].slug)}` : "/products?category=mate-gourds"}
            imageUrl={products[2]?.images[0]?.url ?? null}
            imageAlt={products[2]?.name}
            description={products[2]?.description ?? null}
            backgroundColor="bg-gray-200"
            productId={products[2]?.id}
            productSlug={products[2]?.slug}
          />
          <PromoBlock
            title={products[3]?.name ?? "Herbal blends"}
            price={products[3] ? `€${Number(products[3].price).toFixed(2)}` : "€19.99"}
            href={products[3] ? `/products/${encodeURIComponent(products[3].slug)}` : "/products"}
            imageUrl={products[3]?.images[0]?.url ?? null}
            imageAlt={products[3]?.name}
            description={products[3]?.description ?? null}
            backgroundColor="bg-gray-100"
            productId={products[3]?.id}
            productSlug={products[3]?.slug}
          />
        </section>

        <ProductCarouselSection title="Top selling" products={carouselProducts.slice(0, 8)} />

        <BrowseByCategory />

        <TestimonialsSection />

        <BrandPartners />

        <FollowSubscribe />
      </main>

      <Footer />
    </div>
  );
}
