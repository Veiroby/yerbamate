import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/app/components/product-card";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { ProductFilters, ActiveFilters } from "@/app/components/product-filters";
import { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  "yerba-mate": "Yerba Mate",
  "mate-gourds": "Mate Gourds",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    origin?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const params = await searchParams;

  const { q, category, brand, origin, minPrice, maxPrice, sort } = params;

  const where: Prisma.ProductWhereInput = {
    active: true,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { origin: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (brand) {
    where.brand = brand;
  }

  if (origin) {
    where.origin = origin;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice);
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "name-asc":
      orderBy = { name: "asc" };
      break;
    case "name-desc":
      orderBy = { name: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
  }

  const [products, categories, allProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { include: { inventoryItems: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { brand: true, origin: true, price: true },
    }),
  ]);

  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))] as string[];
  const origins = [...new Set(allProducts.map((p) => p.origin).filter(Boolean))] as string[];
  const prices = allProducts.map((p) => Number(p.price));
  const priceRange = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 100,
  };

  const filterOptions = {
    categories,
    brands: brands.sort(),
    origins: origins.sort(),
    priceRange,
  };

  const categoryLabel = category ? CATEGORY_LABELS[category] ?? category : null;

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
      brand: p.brand,
      origin: p.origin,
    };
  });

  const getPageTitle = () => {
    if (q) return `Search: "${q}"`;
    if (categoryLabel) return categoryLabel;
    return "All Products";
  };

  const getPageDescription = () => {
    if (q) return `${products.length} results found`;
    if (categoryLabel) return `Browse our ${categoryLabel.toLowerCase()} selection`;
    return "Browse our full yerba mate catalog";
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
              {getPageTitle()}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {getPageDescription()}
            </p>
          </div>
          <Link
            href="/cart"
            className="hidden sm:inline-flex rounded-2xl border border-stone-300 px-4 py-2 text-sm font-medium transition hover:border-teal-500 hover:text-teal-700"
          >
            View cart
          </Link>
        </header>

        <ProductFilters options={filterOptions} />

        <ActiveFilters />

        <div>
          {productCards.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-stone-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-stone-900">
                No products found
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Try adjusting your filters or search terms.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-stone-500">
                Showing {productCards.length} product{productCards.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {productCards.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showDescription
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
