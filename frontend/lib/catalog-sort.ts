/** Shared storefront catalog ordering: in stock first, warehouse next, sold-out last. */

export function isSoldOutForCatalog(
  stockLocation: string | null | undefined,
  quantityLeft: number,
): boolean {
  return (stockLocation ?? "instock") === "instock" && quantityLeft <= 0;
}

export type CatalogSortable = {
  stockLocation?: string | null;
  quantityLeft: number;
  isBestseller?: boolean;
  bestsellerRank?: number | null;
  catalogSortOrder?: number;
  name?: string;
};

export function compareCatalogProducts(
  a: CatalogSortable,
  b: CatalogSortable,
): number {
  const soldA = isSoldOutForCatalog(a.stockLocation, a.quantityLeft) ? 1 : 0;
  const soldB = isSoldOutForCatalog(b.stockLocation, b.quantityLeft) ? 1 : 0;
  if (soldA !== soldB) return soldA - soldB;

  const warehouseA = (a.stockLocation ?? "instock") === "warehouse" ? 1 : 0;
  const warehouseB = (b.stockLocation ?? "instock") === "warehouse" ? 1 : 0;
  if (warehouseA !== warehouseB) return warehouseA - warehouseB;

  const bestA = a.isBestseller ? 0 : 1;
  const bestB = b.isBestseller ? 0 : 1;
  if (bestA !== bestB) return bestA - bestB;

  if (a.isBestseller && b.isBestseller) {
    const rankA = a.bestsellerRank ?? 9999;
    const rankB = b.bestsellerRank ?? 9999;
    if (rankA !== rankB) return rankA - rankB;
  } else {
    const orderA = a.catalogSortOrder ?? 0;
    const orderB = b.catalogSortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
  }

  return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
}

export function sortCatalogProducts<T extends CatalogSortable>(items: T[]): T[] {
  return [...items].sort(compareCatalogProducts);
}
