import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getExt(mime: string, fileName?: string): string {
  const m = (mime || "").toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".png")) return "png";
    if (lower.endsWith(".webp")) return "webp";
    if (lower.endsWith(".gif")) return "gif";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpg";
  }
  return "jpg";
}

function normalizeMime(file: File): string {
  const t = (file.type || "").toLowerCase();
  if (t && ALLOWED_TYPES.includes(t)) return t;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return t || "application/octet-stream";
}

export async function saveProductImage(
  productId: string,
  position: number,
  file: File,
): Promise<string> {
  const mime = normalizeMime(file);
  if (!ALLOWED_TYPES.includes(mime)) {
    throw new Error(`Invalid file type: ${file.type || "unknown"} (name: ${file.name})`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large (max ${MAX_SIZE / 1024 / 1024}MB)`);
  }
  const dir = path.join(UPLOAD_DIR, productId);
  await mkdir(dir, { recursive: true });
  const ext = getExt(mime, file.name);
  const filename = `${position}.${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  return `/uploads/products/${productId}/${filename}`;
}
