import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/app/components/product-card";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

export const dynamic = "force-dynamic";

const CATEGORY_SLUGS = {
  "yerba-mate": "Yerba Mate",
  "mate-gourds": "Mate gourds",
} as const;

type Props = { searchParams: Promise<{ category?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { category: categorySlug } = await searchParams;

  const where = {
    active: true,
    ...(categorySlug && CATEGORY_SLUGS[categorySlug as keyof typeof CATEGORY_SLUGS] && {
      category: { slug: categorySlug },
    }),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { include: { inventoryItems: true } },
    },
  });

  const categoryLabel = categorySlug && CATEGORY_SLUGS[categorySlug as keyof typeof CATEGORY_SLUGS]
    ? CATEGORY_SLUGS[categorySlug as keyof typeof CATEGORY_SLUGS]
    : null;

  const productCards = products.map((p) => {
    const quantityLeft = p.variants.reduce(
      (sum, v) =>
        sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
      0,
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
      description: p.description,
    };
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
              {categoryLabel ?? "All products"}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {categoryLabel
                ? `Browse our ${categoryLabel.toLowerCase()} selection.`
                : "Browse our full yerba mate catalog."}
            </p>
          </div>
          <Link
            href="/cart"
            className="rounded-2xl border border-stone-300 px-4 py-2 text-sm font-medium transition hover:border-teal-500 hover:text-teal-700"
          >
            View cart
          </Link>
        </header>

        {productCards.length === 0 ? (
          <p className="text-sm text-stone-500">
            No products available yet. Add some items from the admin panel.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productCards.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showDescription
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

