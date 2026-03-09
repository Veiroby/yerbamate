import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCarousel, type ProductCard } from "./components/product-carousel";
import { SiteHeader } from "./components/site-header";
import { NewsletterSignup } from "./components/newsletter-signup";
import { SiteFooter } from "./components/site-footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      images: {
        orderBy: { position: "asc" },
        take: 1,
      },
      variants: {
        include: {
          inventoryItems: true,
        },
      },
    },
  });

  const productCards: ProductCard[] = products.map((p) => {
    const quantityLeft = p.variants.reduce(
      (sum, v) =>
        sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const img = p.images[0];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      imageUrl: img?.url ?? null,
      imageAlt: img?.altText ?? null,
      quantityLeft,
    };
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main>
        {/* Hero */}
        <section className="relative pb-12 md:pb-16">
          <div className="relative overflow-hidden bg-stone-800">
            <Image
              src="/bannerym.jpg"
              alt="Yerba mate"
              width={1920}
              height={500}
              className="h-[500px] w-full object-cover opacity-75"
              priority
            />
            <div className="absolute inset-0 bg-stone-900/40" aria-hidden />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <h1 className="font-serif mb-4 text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
                Welcome to YerbaTea
              </h1>
              <p className="mb-6 max-w-lg text-lg text-stone-100">
                Premium yerba mate and mate gourds, delivered to your door.
              </p>
              <Link
                href="/products"
                className="inline-flex rounded-2xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-teal-700 hover:shadow-xl"
              >
                Explore
              </Link>
            </div>
          </div>
        </section>

        {/* Product carousel */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900">
              Featured products
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-teal-700 hover:text-teal-800 transition"
            >
              View all
            </Link>
          </div>
          <ProductCarousel products={productCards} />
        </section>

        {/* Newsletter */}
        <section className="border-t border-stone-200 bg-stone-100/50 px-4 py-10">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-serif mb-2 text-lg font-semibold text-stone-900">
              Stay in the loop
            </h2>
            <p className="mb-4 text-sm text-stone-600">
              New arrivals, offers, and tips. No spam.
            </p>
            <div className="flex justify-center">
              <NewsletterSignup />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
