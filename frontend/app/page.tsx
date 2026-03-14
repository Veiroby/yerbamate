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
import { FollowSubscribe } from "@/app/components/landing/FollowSubscribe";
import { Footer } from "@/app/components/landing/Footer";

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
  }));

  const firstProduct = products[0];
  const secondProduct = products[1];

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
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
            backgroundColor="bg-[#606C38]/20"
            productId={firstProduct?.id}
            productSlug={firstProduct?.slug}
          />
          <PromoBlock
            title={secondProduct?.name ?? "Best blends"}
            price={secondProduct ? `€${Number(secondProduct.price).toFixed(2)}` : "€19.99"}
            href={secondProduct ? `/products/${encodeURIComponent(secondProduct.slug)}` : "/products"}
            imageUrl={secondProduct?.images[0]?.url ?? null}
            imageAlt={secondProduct?.name}
            backgroundColor="bg-[#DDA15E]/25"
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
            backgroundColor="bg-[#BC6C25]"
            textColor="text-white"
            productId={products[2]?.id}
            productSlug={products[2]?.slug}
          />
          <PromoBlock
            title={products[3]?.name ?? "Herbal blends"}
            price={products[3] ? `€${Number(products[3].price).toFixed(2)}` : "€19.99"}
            href={products[3] ? `/products/${encodeURIComponent(products[3].slug)}` : "/products"}
            imageUrl={products[3]?.images[0]?.url ?? null}
            imageAlt={products[3]?.name}
            backgroundColor="bg-[#606C38]/15"
            productId={products[3]?.id}
            productSlug={products[3]?.slug}
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
