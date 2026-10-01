import { prisma } from "@/lib/db";
import { saveProductImage } from "@/lib/upload";

export const MAX_PRODUCT_IMAGES = 3;

export function filesFromFormData(formData: FormData, field = "images"): File[] {
  const files: File[] = [];
  for (const entry of formData.getAll(field)) {
    if (typeof entry === "string") continue;
    const file = entry as File;
    if (typeof file.size !== "number" || file.size <= 0) continue;
    if (typeof file.arrayBuffer !== "function") continue;
    files.push(file);
  }
  return files;
}

export async function appendProductImages(
  productId: string,
  productName: string,
  files: File[],
): Promise<{ ok: true; count: number } | { ok: false; code: "empty" | "full" | "type" | "size" | "upload" }> {
  if (files.length === 0) return { ok: false, code: "empty" };

  const existing = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });
  const room = MAX_PRODUCT_IMAGES - existing.length;
  if (room <= 0) return { ok: false, code: "full" };

  const start = existing.reduce((max, image) => Math.max(max, image.position), -1) + 1;
  const accepted = files.slice(0, room);
  let saved = 0;
  for (let i = 0; i < accepted.length; i++) {
    try {
      const url = await saveProductImage(productId, start + i, accepted[i]);
      await prisma.productImage.create({
        data: {
          productId,
          url,
          position: start + i,
          altText: `${productName} image ${start + i + 1}`,
        },
      });
      saved += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      console.error("Product image upload failed:", err);
      if (saved > 0) return { ok: true, count: saved };
      if (message.startsWith("Invalid file type")) return { ok: false, code: "type" };
      if (message.startsWith("File too large")) return { ok: false, code: "size" };
      return { ok: false, code: "upload" };
    }
  }
  return { ok: true, count: saved };
}
