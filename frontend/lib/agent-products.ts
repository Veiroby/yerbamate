import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/admin-audit";
import { getProductTotalStock } from "@/app/admin/products/product-quantity";
import { findProductForAgent } from "@/lib/agent-inventory";
import type { Prisma } from "@/app/generated/prisma/client";

const PAID_LIKE = ["PAID", "PROCESSING", "SHIPPED"] as const;

export function slugFromName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type AgentProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  descriptionLv: string | null;
  price: number;
  currency: string;
  barcode: string | null;
  brand: string | null;
  origin: string | null;
  active: boolean;
  archived: boolean;
  isDraft: boolean;
  stockLocation: string | null;
  quantity: number;
  outOfStock: boolean;
  isBestseller: boolean;
  bestsellerRank: number | null;
  catalogSortOrder: number;
  category: { id: string; slug: string; name: string } | null;
};

async function serializeProduct(
  product: Prisma.ProductGetPayload<{
    include: { category: { select: { id: true; slug: true; name: true } } };
  }>,
): Promise<AgentProductRow> {
  const quantity = await getProductTotalStock(product.id);
  const stockLocation = product.stockLocation ?? "instock";
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    descriptionEn: product.descriptionEn,
    descriptionLv: product.descriptionLv,
    price: Number(product.price),
    currency: product.currency,
    barcode: product.barcode,
    brand: product.brand,
    origin: product.origin,
    active: product.active,
    archived: product.archived,
    isDraft: product.isDraft,
    stockLocation,
    quantity,
    outOfStock: stockLocation === "instock" && quantity <= 0,
    isBestseller: product.isBestseller,
    bestsellerRank: product.bestsellerRank,
    catalogSortOrder: product.catalogSortOrder,
    category: product.category,
  };
}

const productInclude = {
  category: { select: { id: true, slug: true, name: true } },
} as const;

export async function listProductsForAgent(options?: {
  includeArchived?: boolean;
  includeDraft?: boolean;
  limit?: number;
}) {
  const products = await prisma.product.findMany({
    where: {
      archived: options?.includeArchived ? undefined : false,
      isDraft: options?.includeDraft ? undefined : false,
    },
    orderBy: [{ isBestseller: "desc" }, { bestsellerRank: "asc" }, { name: "asc" }],
    take: Math.min(options?.limit ?? 100, 200),
    include: productInclude,
  });

  return Promise.all(products.map(serializeProduct));
}

export async function getProductForAgent(idOrQuery: string) {
  const found = await findProductForAgent(idOrQuery);
  if (!found) return null;

  const product = await prisma.product.findUnique({
    where: { id: found.id },
    include: productInclude,
  });
  if (!product) return null;
  return serializeProduct(product);
}

export type AgentProductUpdate = {
  name?: string;
  slug?: string;
  descriptionEn?: string | null;
  descriptionLv?: string | null;
  active?: boolean;
  isBestseller?: boolean;
  bestsellerRank?: number | null;
  catalogSortOrder?: number;
};

export async function updateProductForAgent(
  idOrQuery: string,
  patch: AgentProductUpdate,
  actorId: string | null,
) {
  const found = await findProductForAgent(idOrQuery);
  if (!found) {
    return { ok: false as const, error: "Product not found", status: 404 };
  }

  const data: Prisma.ProductUpdateInput = {};
  if (patch.name !== undefined) {
    data.name = patch.name.trim();
    if (!data.name) {
      return { ok: false as const, error: "Name cannot be empty", status: 400 };
    }
  }
  if (patch.slug !== undefined) {
    const slug = slugFromName(patch.slug);
    if (!slug) {
      return { ok: false as const, error: "Invalid slug", status: 400 };
    }
    const taken = await prisma.product.findFirst({
      where: { slug, id: { not: found.id } },
      select: { id: true },
    });
    if (taken) {
      return { ok: false as const, error: "Slug already in use", status: 400 };
    }
    data.slug = slug;
  }
  if (patch.descriptionEn !== undefined) {
    data.descriptionEn = patch.descriptionEn;
    data.description = patch.descriptionEn;
  }
  if (patch.descriptionLv !== undefined) {
    data.descriptionLv = patch.descriptionLv;
  }
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.isBestseller !== undefined) data.isBestseller = patch.isBestseller;
  if (patch.bestsellerRank !== undefined) data.bestsellerRank = patch.bestsellerRank;
  if (patch.catalogSortOrder !== undefined) data.catalogSortOrder = patch.catalogSortOrder;

  if (Object.keys(data).length === 0) {
    return { ok: false as const, error: "No fields to update", status: 400 };
  }

  const updated = await prisma.product.update({
    where: { id: found.id },
    data,
    include: productInclude,
  });

  if (actorId) {
    await writeAuditLog(actorId, "product.agent_updated", "Product", found.id, {
      patch,
      via: "agent",
    });
  }

  return { ok: true as const, product: await serializeProduct(updated) };
}

/** Set bestseller flags from paid order volume (last 90 days). */
export async function refreshBestsellersFromSales(
  actorId: string | null,
  options?: { topN?: number; days?: number },
) {
  const topN = options?.topN ?? 12;
  const days = options?.days ?? 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      product: { archived: false, isDraft: false },
      order: {
        archived: false,
        status: { in: [...PAID_LIKE] },
        createdAt: { gte: since },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: topN,
  });

  const productIds = rows
    .map((r) => r.productId)
    .filter((id): id is string => Boolean(id));

  await prisma.product.updateMany({
    where: { archived: false },
    data: { isBestseller: false, bestsellerRank: null },
  });

  await Promise.all(
    productIds.map((productId, index) =>
      prisma.product.update({
        where: { id: productId },
        data: { isBestseller: true, bestsellerRank: index + 1 },
      }),
    ),
  );

  if (actorId) {
    await writeAuditLog(actorId, "product.bestsellers_refreshed", "Product", "catalog", {
      topN,
      days,
      productIds,
      via: "agent",
    });
  }

  const products = await listProductsForAgent({ limit: topN });
  const bestsellers = products.filter((p) => p.isBestseller);

  return {
    days,
    topN,
    updated: productIds.length,
    bestsellers,
  };
}
