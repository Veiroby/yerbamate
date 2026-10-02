/** Shelf price plus bottle deposit. This is the amount added to the cart. */
export function chargedUnitPrice(price: unknown, bottleDeposit?: unknown): number {
  const shelf = Number(price);
  const deposit = Number(bottleDeposit ?? 0);
  const total =
    (Number.isFinite(shelf) ? shelf : 0) + (Number.isFinite(deposit) && deposit > 0 ? deposit : 0);
  return Math.round(total * 100) / 100;
}
