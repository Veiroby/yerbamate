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

  const popularProducts = productCards.slice(0, 4);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-stone-900">
          <div className="relative h-[520px] w-full md:h-[580px]">
            <Image
              src="/images/tea-farmer-hero.jpg"
              alt="Tea farmer inspecting fresh leaves in a green valley"
              width={1920}
              height={800}
              className="h-full w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/70 to-stone-900/30" />

            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 py-12 md:px-6 lg:px-8">
              <div className="max-w-xl space-y-5 text-left text-white">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-teal-200">
                  Yerba mate from the source
                </span>
                <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                  Crafted from the{" "}
                  <span className="text-teal-300">freshest leaves</span>.
                </h1>
                <p className="text-sm text-stone-200 sm:text-base">
                  Discover carefully selected yerba mate blends and traditional
                  gourds, sourced from small farmers and delivered straight to
                  your cup.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/products?category=yerba-mate"
                    className="inline-flex items-center rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/40 transition hover:bg-teal-500 hover:shadow-xl"
                  >
                    Shop yerba mate
                  </Link>
                  <Link
                    href="/products?category=mate-gourds"
                    className="inline-flex items-center rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                  >
                    Browse gourds
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intro / value props */}
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-[1.4fr,1fr] md:items-center">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                Come and explore the{" "}
                <span className="text-teal-700">world of Yerba mate</span>.
              </h2>
              <p className="mt-3 text-sm text-stone-600 md:text-base">
                We hand‑select each product to bring you authentic flavors,
                clean ingredients and a calm daily ritual. From smooth, balanced
                blends to bold traditional cuts, there&apos;s a YerbaTea for
                every moment.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Freshly sourced
                </p>
                <p className="mt-1 text-sm font-medium text-stone-900">
                  Small‑batch harvests, carefully stored to keep aroma and
                  flavour.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Fair partnerships
                </p>
                <p className="mt-1 text-sm font-medium text-stone-900">
                  Working closely with growers to support fair pricing and
                  quality.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Fast delivery
                </p>
                <p className="mt-1 text-sm font-medium text-stone-900">
                  Local stock in Latvia with tracked delivery options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Collections / categories */}
        <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900">
                Our tailored collections
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Curated sets to help you start or deepen your yerba mate ritual.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline sm:inline-flex"
            >
              View all products
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/products?category=yerba-mate"
              className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-teal-900 via-teal-800 to-stone-900 p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                Collection
              </p>
              <h3 className="mt-2 text-lg font-semibold">Yerba mate blends</h3>
              <p className="mt-2 text-sm text-teal-100/90">
                Smooth, balanced and energising cuts from trusted farmers.
              </p>
              <span className="mt-4 inline-flex items-center text-xs font-medium text-teal-200">
                Explore blends
              </span>
            </Link>

            <Link
              href="/products?category=mate-gourds"
              className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Essentials
              </p>
              <h3 className="mt-2 text-lg font-semibold text-stone-900">
                Gourds & bombillas
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Traditional cups and stainless steel straws to complete your
                set‑up.
              </p>
              <span className="mt-4 inline-flex items-center text-xs font-medium text-teal-700">
                Browse accessories
              </span>
            </Link>

            <Link
              href="/products?tag=starter-kit"
              className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-900 p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-300">
                New to yerba mate?
              </p>
              <h3 className="mt-2 text-lg font-semibold">
                Starter kits & gifts
              </h3>
              <p className="mt-2 text-sm text-stone-200">
                Everything you need in one box – perfect for gifting or
                starting fresh.
              </p>
              <span className="mt-4 inline-flex items-center text-xs font-medium text-teal-200">
                See starter kits
              </span>
            </Link>
          </div>
        </section>

        {/* Popular products grid */}
        {popularProducts.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-14">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900">
                  Discover our most popular picks
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Customer favourites that are often in repeat orders.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline"
              >
                View all products
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-stone-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.imageAlt ?? product.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                        Image coming soon
                      </div>
                    )}
                    {product.quantityLeft <= 5 && product.quantityLeft > 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Low stock
                      </span>
                    )}
                    {product.quantityLeft === 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-stone-900">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-teal-700">
                      {product.price.toFixed(2)} {product.currency}
                    </p>
                    <p className="mt-auto pt-2 text-xs text-stone-500">
                      Ships in 1–2 working days from Latvia
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Product carousel as secondary section */}
        {productCards.length > 4 && (
          <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900">
                Explore more products
              </h2>
              <Link
                href="/products"
                className="text-sm font-medium text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline"
              >
                View full catalogue
              </Link>
            </div>
            <ProductCarousel products={productCards} />
          </section>
        )}

        {/* How it works */}
        <section className="border-t border-stone-200 bg-stone-100/70 px-4 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-[1.2fr,1fr] md:items-center">
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                  Simple ordering process.
                </h2>
                <p className="mt-2 text-sm text-stone-600 md:text-base">
                  From adding your favourite yerba mate to enjoying the first
                  sip, we keep everything straightforward and transparent.
                </p>
                <ol className="mt-6 space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">
                        Choose your products
                      </p>
                      <p className="text-stone-600">
                        Explore yerba mate, gourds and starter kits – add items
                        to your cart in a few clicks.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">
                        Secure checkout & shipping
                      </p>
                      <p className="text-stone-600">
                        Pay with Stripe or wire transfer and select DPD
                        delivery or parcel machine.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">
                        Brew & enjoy
                      </p>
                      <p className="text-stone-600">
                        Follow the instructions on the package or our blog and
                        enjoy your new daily ritual.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-stone-900 p-6 text-white shadow-lg">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                    Ready to start?
                  </p>
                  <h3 className="text-lg font-semibold">
                    Explore your favourite blends and order today.
                  </h3>
                  <p className="text-sm text-teal-100">
                    New to yerba mate? Begin with a starter kit and we&apos;ll
                    guide you step by step.
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 inline-flex items-center rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                  >
                    Start shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t border-stone-200 bg-stone-50 px-4 py-10">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-serif mb-2 text-lg font-semibold text-stone-900">
              Stay in the YerbaTea loop
            </h2>
            <p className="mb-4 text-sm text-stone-600">
              New arrivals, brewing tips and special offers. No spam – just good
              mate.
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
