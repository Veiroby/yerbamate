export type BundleRule = { minQuantity: number; discountPercent: unknown };

export function bestBundleForQty(qty: number, bundles: BundleRule[]) {
  if (!Array.isArray(bundles) || bundles.length === 0) return null;
  const applicable = bundles
    .filter((b) => qty >= b.minQuantity)
    .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));
  return applicable[0] ?? null;
}

export function calculateBundleSavings(
  items: Array<{
    quantity: number;
    unitPrice: unknown;
    product: { bundleOffers: BundleRule[] } | null;
  }>,
  globalBundles: BundleRule[],
): number {
  let totalSavings = 0;

  for (const item of items) {
    if (!item.product) continue;
    const price = Number(item.unitPrice);
    const qty = item.quantity;
    const lineTotal = price * qty;

    const productBundles = item.product.bundleOffers || [];
    const allBundles = [...productBundles, ...globalBundles];
    const best = bestBundleForQty(qty, allBundles);
    if (!best) continue;

    const discount = (lineTotal * Number(best.discountPercent)) / 100;
    if (discount > 0) totalSavings += discount;
  }

  return Math.round(totalSavings * 100) / 100;
}

