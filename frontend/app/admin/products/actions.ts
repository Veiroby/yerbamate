"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setProductQuantityWithLocation } from "./product-quantity";

export type BulkProductUpdate = {
  id: string;
  quantity?: number;
  stockLocation?: "instock" | "warehouse";
  categoryId?: string | null;
  barcode?: string | null;
  weight?: string | null;
  price?: number;
  active?: boolean;
};

export async function bulkUpdateProducts(updates: BulkProductUpdate[]) {
  if (!Array.isArray(updates) || updates.length === 0) return;

  const normalized = updates
    .filter((u) => u && typeof u.id === "string" && u.id.trim().length > 0)
    .map((u) => ({
      id: u.id,
      quantity:
        typeof u.quantity === "number" && Number.isFinite(u.quantity)
          ? Math.max(0, Math.floor(u.quantity))
          : undefined,
      stockLocation: u.stockLocation,
      categoryId: u.categoryId ?? undefined,
      barcode: u.barcode ?? undefined,
      weight: u.weight ?? undefined,
      price:
        typeof u.price === "number" && Number.isFinite(u.price) && u.price >= 0
          ? u.price
          : undefined,
      active: typeof u.active === "boolean" ? u.active : undefined,
    }));

  for (const u of normalized) {
    const data: Parameters<typeof prisma.product.update>[0]["data"] = {};

    if (u.stockLocation) {
      data.stockLocation = u.stockLocation === "warehouse" ? "warehouse" : "instock";
    }
    if (u.categoryId !== undefined) {
      data.categoryId = u.categoryId || undefined;
    }
    if (u.barcode !== undefined) {
      data.barcode = u.barcode || undefined;
    }
    if (u.weight !== undefined) {
      data.weight = u.weight || undefined;
    }
    if (u.price !== undefined) {
      data.price = u.price;
    }
    if (u.active !== undefined) {
      data.active = u.active;
    }

    if (Object.keys(data).length > 0) {
      await prisma.product.update({
        where: { id: u.id },
        data,
      });
    }

    if (u.quantity !== undefined) {
      await setProductQuantityWithLocation(
        u.id,
        u.quantity,
        u.stockLocation === "warehouse" ? "warehouse" : undefined,
      );
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function deleteProductAction(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  if (!productId) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return;

  const variants = await prisma.variant.findMany({
    where: { productId },
    select: { id: true },
  });
  const variantIds = variants.map((v) => v.id);
  await prisma.inventoryItem.deleteMany({
    where: { variantId: { in: variantIds } },
  });
  await prisma.product.delete({
    where: { id: productId },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products?saved=1");
}

