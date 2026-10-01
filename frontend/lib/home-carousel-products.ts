import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import {
  categorySlugIncludingAdminDuplicates,
  mateGourdsCategoryWhere,
} from "@/lib/category-filters";
import { sortCatalogProducts } from "@/lib/catalog-sort";

const CAROUSEL_INCLUDE = {
  category: { select: { slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: { include: { inventoryItems: true } },
} satisfies Prisma.ProductInclude;

export type HomeCarouselProduct = Prisma.ProductGetPayload<{
  include: typeof CAROUSEL_INCLUDE;
}>;

const YERBA_BESTSELLER_HINTS = [
  "Canarias",
  "Amanda",
  "Taragui",
  "Playadito",
  "CBSe",
  "Rosamonte",
] as const;

const STORE_VISIBLE: Prisma.ProductWhereInput = {
  active: true,
  archived: false,
  isDraft: false,
};

function quantityLeft(p: HomeCarouselProduct): number {
  return p.variants.reduce(
    (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );
}

function sortHomeProducts(products: HomeCarouselProduct[]): HomeCarouselProduct[] {
  const sortable = products.map((p) => ({
    product: p,
    quantityLeft: quantityLeft(p),
    stockLocation: p.stockLocation,
    isBestseller: p.isBestseller,
    bestsellerRank: p.bestsellerRank,
    catalogSortOrder: p.catalogSortOrder,
    name: p.name,
  }));
  return sortCatalogProducts(sortable).map((row) => row.product);
}

function dedupeProducts(products: HomeCarouselProduct[]): HomeCarouselProduct[] {
  const seen = new Set<string>();
  const out: HomeCarouselProduct[] = [];
  for (const p of products) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

async function yerbaMateBestsellers(take: number): Promise<HomeCarouselProduct[]> {
  const flagged = await prisma.product.findMany({
    where: {
      ...STORE_VISIBLE,
      isBestseller: true,
      category: categorySlugIncludingAdminDuplicates("yerba-mate"),
    },
    orderBy: [{ bestsellerRank: "asc" }, { name: "asc" }],
    take,
    include: CAROUSEL_INCLUDE,
  });
  if (flagged.length >= Math.min(3, take)) {
    return flagged;
  }

  const byName = await prisma.product.findMany({
    where: {
      ...STORE_VISIBLE,
      category: categorySlugIncludingAdminDuplicates("yerba-mate"),
      OR: YERBA_BESTSELLER_HINTS.map((hint) => ({
        name: { contains: hint, mode: "insensitive" as const },
      })),
    },
    orderBy: { name: "asc" },
    take: take * 2,
    include: CAROUSEL_INCLUDE,
  });

  return dedupeProducts([...flagged, ...byName]).slice(0, take);
}

async function mateGourdsForCarousel(take: number): Promise<HomeCarouselProduct[]> {
  return prisma.product.findMany({
    where: {
      ...STORE_VISIBLE,
      category: mateGourdsCategoryWhere(),
    },
    orderBy: { createdAt: "desc" },
    take: take * 2,
    include: CAROUSEL_INCLUDE,
  }).then((rows) => sortHomeProducts(rows).slice(0, take));
}

async function newestVisibleYerba(take: number): Promise<HomeCarouselProduct[]> {
  return prisma.product.findMany({
    where: {
      ...STORE_VISIBLE,
      category: categorySlugIncludingAdminDuplicates("yerba-mate"),
    },
    orderBy: { updatedAt: "desc" },
    take,
    include: CAROUSEL_INCLUDE,
  });
}

/** New arrivals: newest yerba mate, then bestsellers and mate gourds. */
export async function getHomeNewArrivalsProducts(
  limit = 8,
): Promise<HomeCarouselProduct[]> {
  const yerbaSlots = Math.ceil(limit * 0.55);
  const gourdSlots = limit - yerbaSlots;

  const [newest, yerba, gourds] = await Promise.all([
    newestVisibleYerba(2),
    yerbaMateBestsellers(yerbaSlots),
    mateGourdsForCarousel(gourdSlots),
  ]);

  return dedupeProducts([...newest, ...yerba, ...gourds]).slice(0, limit);
}

/** Yerba mate carousel: newest products first, then bestsellers. */
export async function getHomeYerbaMateProducts(
  limit = 8,
): Promise<HomeCarouselProduct[]> {
  const newest = await newestVisibleYerba(2);
  const products = await prisma.product.findMany({
    where: {
      ...STORE_VISIBLE,
      category: categorySlugIncludingAdminDuplicates("yerba-mate"),
    },
    orderBy: [
      { isBestseller: "desc" },
      { bestsellerRank: "asc" },
      { name: "asc" },
    ],
    take: limit * 3,
    include: CAROUSEL_INCLUDE,
  });

  const flagged = sortHomeProducts(products.filter((p) => p.isBestseller));
  const rest =
    flagged.length >= limit
      ? flagged
      : sortHomeProducts(
          dedupeProducts([
            ...flagged,
            ...(await yerbaMateBestsellers(limit)),
            ...products,
          ]),
        );

  return dedupeProducts([...newest, ...rest]).slice(0, limit);
}
