import { cache } from "react";
import { prisma } from "@/lib/db";
import { getProductTotalStock, setProductQuantityWithLocation } from "@/app/admin/products/product-quantity";

type ShelfRow = { slug: string | null; stock_quantity: number | null };

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

/** Inventory stock by product slug. Empty when inventory is not configured. */
export const getInventoryStockBySlug = cache(async (): Promise<Map<string, number>> => {
  const config = supabaseConfig();
  const stock = new Map<string, number>();
  if (!config) return stock;

  try {
    const response = await fetch(
      `${config.url}/rest/v1/products?select=slug,stock_quantity&limit=2000`,
      {
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) return stock;
    const rows = (await response.json()) as ShelfRow[];
    for (const row of rows) {
      const slug = row.slug?.trim().toLowerCase();
      if (!slug || row.stock_quantity == null) continue;
      stock.set(slug, Math.max(0, Math.floor(Number(row.stock_quantity))));
    }
  } catch (error) {
    console.error("Inventory stock lookup failed", error instanceof Error ? error.message : "unknown");
  }
  return stock;
});

export function onHandFromVariants(
  stockBySlug: Map<string, number>,
  product: {
    slug: string;
    stockLocation?: string | null;
    variants: { inventoryItems: { quantity: number }[] }[];
  },
): number {
  const local = product.variants.reduce(
    (sum, variant) => sum + variant.inventoryItems.reduce((inner, item) => inner + item.quantity, 0),
    0,
  );
  return storefrontOnHand(stockBySlug, product.slug, product.stockLocation, local);
}

/** Shelf products use inventory stock. Warehouse products keep the shop quantity. */
export function storefrontOnHand(
  stockBySlug: Map<string, number>,
  slug: string,
  stockLocation: string | null | undefined,
  localQuantity: number,
): number {
  if ((stockLocation ?? "instock") === "warehouse") return localQuantity;
  const remote = stockBySlug.get(slug.trim().toLowerCase());
  if (remote == null) return localQuantity;
  return remote;
}

async function decrementInventorySlug(slug: string, amount: number): Promise<void> {
  const config = supabaseConfig();
  if (!config) return;
  const normalized = slug.trim();
  const lookup = await fetch(
    `${config.url}/rest/v1/products?slug=ilike.${encodeURIComponent(normalized)}&select=id,stock_quantity&limit=1`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
    },
  );
  if (!lookup.ok) return;
  const rows = (await lookup.json()) as { id: string; stock_quantity: number | null }[];
  const row = rows[0];
  if (!row) return;
  const next = Math.max(0, Math.floor(Number(row.stock_quantity ?? 0)) - amount);
  await fetch(`${config.url}/rest/v1/products?id=eq.${encodeURIComponent(row.id)}`, {
    method: "PATCH",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ stock_quantity: next, in_stock: next > 0 }),
  });
}

/** Subtract fulfilled quantities from inventory once per order. */
export async function deductInventoryForFulfilledOrder(orderId: string): Promise<void> {
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, inventoryDeductedAt: null },
    data: { inventoryDeductedAt: new Date() },
  });
  if (claimed.count === 0) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, stockLocation: true } },
        },
      },
    },
  });
  if (!order) return;

  for (const item of order.items) {
    const product = item.product;
    if (!product || product.stockLocation === "warehouse") continue;
    const amount = Math.max(0, item.quantity);
    if (amount === 0) continue;

    const current = await getProductTotalStock(product.id);
    await setProductQuantityWithLocation(product.id, Math.max(0, current - amount));
    await decrementInventorySlug(product.slug, amount);
  }
}
