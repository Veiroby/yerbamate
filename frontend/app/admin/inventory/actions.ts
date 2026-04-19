"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setProductQuantityWithLocation } from "@/app/admin/products/product-quantity";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";

export async function saveInventoryAction(formData: FormData) {
  const user = await requireAdminWrite();
  const productId = formData.get("productId")?.toString();
  const quantity = Number.parseInt(
    formData.get("quantity")?.toString() ?? "0",
    10,
  );
  const location = formData.get("location")?.toString().trim() || null;

  if (!productId || !Number.isFinite(quantity)) return;

  await setProductQuantityWithLocation(productId, quantity, location, {
    actorId: user.id,
    reason: "admin_inventory_save",
  });
  await writeAuditLog(user.id, "inventory.adjusted", "Product", productId, {
    quantity,
    location,
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  redirect("/admin/inventory?saved=1");
}

export async function removeFromStockAction(formData: FormData) {
  const user = await requireAdminWrite();
  const productId = formData.get("productId")?.toString();
  if (!productId) return;
  await setProductQuantityWithLocation(productId, 0, null, {
    actorId: user.id,
    reason: "admin_inventory_clear",
  });
  await writeAuditLog(user.id, "inventory.cleared", "Product", productId, {});
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  redirect("/admin/inventory?saved=1");
}
