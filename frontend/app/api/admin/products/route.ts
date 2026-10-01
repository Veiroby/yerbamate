import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";
import { appendProductImages, filesFromFormData } from "@/lib/append-product-images";
import { prisma } from "@/lib/db";
import { setProductQuantityWithLocation } from "@/app/admin/products/product-quantity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function back(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export async function POST(req: Request) {
  const guard = await adminApiGuard(true);
  if (!guard.ok) return back(req, "/admin");

  const formData = await req.formData();
  const name = formData.get("name")?.toString().trim();
  const slug = formData.get("slug")?.toString().trim();
  const price = Number.parseFloat(formData.get("price")?.toString() ?? "0");
  if (!name || !slug || !Number.isFinite(price) || price < 0) {
    return back(req, "/admin/products?error=invalid");
  }

  const description = formData.get("description")?.toString().trim() || null;
  const barcode = formData.get("barcode")?.toString().trim() || null;
  const weight = formData.get("weight")?.toString().trim() || null;
  const quantityRaw = formData.get("quantity")?.toString() ?? "";
  const quantity = quantityRaw === "" ? null : Math.max(0, Math.floor(Number(quantityRaw)));
  const categoryId = formData.get("categoryId")?.toString().trim() || null;
  const stockLocation = formData.get("stockLocation")?.toString() === "warehouse" ? "warehouse" : "instock";

  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price,
        descriptionEn: description,
        description,
        barcode: barcode || undefined,
        weight: weight || undefined,
        categoryId: categoryId || undefined,
        stockLocation,
      },
    });
    productId = product.id;
  } catch (err) {
    console.error("Create product failed:", err);
    return back(req, "/admin/products?error=create");
  }

  const imageFiles = filesFromFormData(formData).slice(0, 3);
  const images = imageFiles.length
    ? await appendProductImages(productId, name, imageFiles)
    : { ok: true as const, count: 0 };

  if (quantity !== null && Number.isFinite(quantity)) {
    await setProductQuantityWithLocation(
      productId,
      quantity,
      stockLocation === "warehouse" ? "warehouse" : undefined,
      { actorId: guard.user.id, reason: "admin_product_create" },
    );
  }

  await writeAuditLog(guard.user.id, "product.created", "Product", productId, { name, slug });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");

  if (!images.ok) {
    return back(req, `/admin/products/${productId}/edit?error=${images.code}`);
  }
  return back(req, "/admin/products?saved=1");
}
