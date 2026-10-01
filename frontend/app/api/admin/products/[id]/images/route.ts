import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";
import { appendProductImages, filesFromFormData } from "@/lib/append-product-images";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function back(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await adminApiGuard(true);
  if (!guard.ok) return back(req, "/admin");

  const { id: productId } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });
  if (!product) return back(req, "/admin/products");

  const formData = await req.formData();
  const result = await appendProductImages(product.id, product.name, filesFromFormData(formData));
  revalidatePath(`/admin/products/${product.id}/edit`);
  revalidatePath("/admin/products");

  if (!result.ok) {
    return back(req, `/admin/products/${product.id}/edit?error=${result.code}`);
  }

  await writeAuditLog(guard.user.id, "product.images_added", "Product", product.id, {
    count: result.count,
  });
  return back(req, `/admin/products/${product.id}/edit?saved=1`);
}
