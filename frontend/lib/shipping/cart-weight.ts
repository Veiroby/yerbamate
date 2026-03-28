import { prisma } from "@/lib/db";
import { parseLooseWeightKg } from "./parse-product-weight-kg";

export { parseLooseWeightKg } from "./parse-product-weight-kg";

export function productUnitWeightKg(product: {
  shippingWeightKg: unknown;
  weight: string | null;
} | null): number {
  if (!product) return 0;
  if (product.shippingWeightKg != null) {
    const n = Number(product.shippingWeightKg);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return parseLooseWeightKg(product.weight) ?? 0;
}

/**
 * Sum of line weights (kg × qty). When nothing can be inferred, returns 0 (caller may treat as 1 kg for quotes).
 */
export async function getCartTotalWeightKg(cartId: string | null | undefined): Promise<number> {
  if (!cartId) return 0;
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: {
        select: { shippingWeightKg: true, weight: true },
      },
    },
  });
  let sum = 0;
  for (const item of items) {
    sum += productUnitWeightKg(item.product) * item.quantity;
  }
  return sum;
}

/** Billing weight for LP parcel quote: at least 1 kg when cart weight is unknown. */
export async function getCartBillingWeightKg(cartId: string | null | undefined): Promise<number> {
  const raw = await getCartTotalWeightKg(cartId);
  if (raw <= 0) return 1;
  return raw;
}
