"use server";

import { prisma } from "@/lib/db";

const DEFAULT_SKU_PREFIX = "default-";

/**
 * Get total stock for a product (sum of all variant inventory items).
 * Used by admin and storefront.
 */
export async function getProductTotalStock(productId: string): Promise<number> {
  const variants = await prisma.variant.findMany({
    where: { productId },
    include: { inventoryItems: true },
  });
  return variants.reduce(
    (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );
}

/**
 * Set product quantity on the Products page. Uses a single "default" variant
 * and one inventory item so the storefront (which sums variant inventory) stays in sync.
 */
export async function setProductQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const qty = Math.max(0, Math.floor(quantity));
  const sku = `${DEFAULT_SKU_PREFIX}${productId}`;

  let variant = await prisma.variant.findFirst({
    where: { productId, sku },
    include: { inventoryItems: true },
  });

  if (!variant) {
    variant = await prisma.variant.create({
      data: {
        productId,
        sku,
        active: true,
        inventoryItems: {
          create: { sku, quantity: qty },
        },
      },
      include: { inventoryItems: true },
    });
    return;
  }

  const item = variant.inventoryItems[0];
  if (item) {
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: qty },
    });
  } else {
    await prisma.inventoryItem.create({
      data: {
        sku,
        variantId: variant.id,
        quantity: qty,
      },
    });
  }
}

/**
 * Set product quantity and optional location. Used by both the Products page
 * and the Inventory page so they share the same inventory record (default variant).
 */
export async function setProductQuantityWithLocation(
  productId: string,
  quantity: number,
  location?: string | null,
): Promise<void> {
  const qty = Math.max(0, Math.floor(quantity));
  const sku = `${DEFAULT_SKU_PREFIX}${productId}`;

  let variant = await prisma.variant.findFirst({
    where: { productId, sku },
    include: { inventoryItems: true },
  });

  if (!variant) {
    variant = await prisma.variant.create({
      data: {
        productId,
        sku,
        active: true,
        inventoryItems: {
          create: { sku, quantity: qty, location: location ?? undefined },
        },
      },
      include: { inventoryItems: true },
    });
    return;
  }

  const item = variant.inventoryItems[0];
  if (item) {
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: qty, location: location ?? undefined },
    });
  } else {
    await prisma.inventoryItem.create({
      data: {
        sku,
        variantId: variant.id,
        quantity: qty,
        location: location ?? undefined,
      },
    });
  }
}
