"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setProductQuantityWithLocation } from "@/app/admin/products/product-quantity";

export async function saveInventoryAction(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  const quantity = Number.parseInt(
    formData.get("quantity")?.toString() ?? "0",
    10,
  );
  const location = formData.get("location")?.toString().trim() || null;

  if (!productId || !Number.isFinite(quantity)) return;

  await setProductQuantityWithLocation(productId, quantity, location);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  redirect("/admin/inventory?saved=1");
}

export async function removeFromStockAction(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  if (!productId) return;
  await setProductQuantityWithLocation(productId, 0, null);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  redirect("/admin/inventory?saved=1");
}
