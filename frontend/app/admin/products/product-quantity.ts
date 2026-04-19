"use server";

import { prisma } from "@/lib/db";

const DEFAULT_SKU_PREFIX = "default-";

export type InventoryAuditContext = {
  actorId: string;
  reason?: string | null;
};

async function recordAdjustment(
  inventoryItemId: string,
  delta: number,
  quantityAfter: number,
  ctx: InventoryAuditContext,
) {
  if (delta === 0) return;
  await prisma.inventoryAdjustment.create({
    data: {
      inventoryItemId,
      delta,
      quantityAfter,
      actorId: ctx.actorId,
      reason: ctx.reason ?? undefined,
    },
  });
}

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
  await setProductQuantityWithLocation(productId, quantity, undefined, undefined);
}

/**
 * Set product quantity and optional location. Used by both the Products page
 * and the Inventory page so they share the same inventory record (default variant).
 */
export async function setProductQuantityWithLocation(
  productId: string,
  quantity: number,
  location?: string | null,
  audit?: InventoryAuditContext,
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
    const inv = variant.inventoryItems[0];
    if (audit && inv && qty !== 0) {
      await recordAdjustment(inv.id, qty, qty, audit);
    }
    return;
  }

  const item = variant.inventoryItems[0];
  if (item) {
    const before = item.quantity;
    const delta = qty - before;
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: qty, location: location ?? undefined },
    });
    if (audit) {
      await recordAdjustment(item.id, delta, qty, audit);
    }
  } else {
    const created = await prisma.inventoryItem.create({
      data: {
        sku,
        variantId: variant.id,
        quantity: qty,
        location: location ?? undefined,
      },
    });
    if (audit && qty !== 0) {
      await recordAdjustment(created.id, qty, qty, audit);
    }
  }
}
