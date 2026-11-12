import { slugify } from "@/lib/slugify";

type InventoryRow = { id: string; stock_quantity: number | null };

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

/** Shop slugs are sometimes the product name. Inventory slugs are kebab-case. */
export function inventoryLookupKeys(slug: string): string[] {
  const raw = slug.trim().toLowerCase();
  const dashed = slugify(slug);
  return [...new Set([raw, dashed].filter(Boolean))];
}

export function inventoryCategoryName(
  categorySlug: string | null | undefined,
  categoryName: string | null | undefined,
): string {
  const slug = (categorySlug ?? "").toLowerCase();
  if (slug.startsWith("mate-gourd") || slug.startsWith("mate-trauc")) return "Gourds";
  if (slug === "drinks" || slug.startsWith("drinks-")) return "Drinks";
  if (slug.includes("accessor")) return "Accessories";
  if (categoryName?.trim()) {
    const name = categoryName.trim().toLowerCase();
    if (name.includes("gourd") || name.includes("trauci") || name.includes("kalebas")) return "Gourds";
    if (name.includes("drink") || name.includes("dzērien")) return "Drinks";
    if (name.includes("accessor")) return "Accessories";
  }
  return "Yerba";
}

function inventoryHeaders(key: string, json = false): HeadersInit {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(json ? { "Content-Type": "application/json", Prefer: "return=minimal" } : {}),
  };
}

async function findInventoryRow(
  config: { url: string; key: string },
  slug: string,
): Promise<InventoryRow | null> {
  for (const key of inventoryLookupKeys(slug)) {
    const lookup = await fetch(
      `${config.url}/rest/v1/products?slug=ilike.${encodeURIComponent(key)}&select=id,stock_quantity&limit=1`,
      { headers: inventoryHeaders(config.key), cache: "no-store" },
    );
    if (!lookup.ok) continue;
    const rows = (await lookup.json()) as InventoryRow[];
    if (rows[0]) return rows[0];
  }
  return null;
}

/** Keep the admin inventory row on the same quantity as the shop. Creates the row when it is missing. */
export async function upsertInventoryStock(input: {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  categorySlug?: string | null;
  categoryName?: string | null;
  active?: boolean;
}): Promise<void> {
  const config = supabaseConfig();
  if (!config) return;
  const quantity = Math.max(0, Math.floor(input.quantity));

  try {
    const existing = await findInventoryRow(config, input.slug);
    if (existing) {
      await fetch(`${config.url}/rest/v1/products?id=eq.${encodeURIComponent(existing.id)}`, {
        method: "PATCH",
        headers: inventoryHeaders(config.key, true),
        body: JSON.stringify({ stock_quantity: quantity, in_stock: quantity > 0 }),
      });
      return;
    }

    const slug = slugify(input.slug) || input.slug.trim().toLowerCase();
    if (!slug) return;
    await fetch(`${config.url}/rest/v1/products`, {
      method: "POST",
      headers: inventoryHeaders(config.key, true),
      body: JSON.stringify({
        name: input.name,
        slug,
        price: input.price,
        category: inventoryCategoryName(input.categorySlug, input.categoryName),
        stock_quantity: quantity,
        in_stock: quantity > 0,
        active: input.active ?? true,
      }),
    });
  } catch (error) {
    console.error("Inventory stock update failed", error instanceof Error ? error.message : "unknown");
  }
}
