import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Resolve public directory correctly in both local dev and production.
// When running with `output: "standalone"`, Next serves from
// `<project>/.next/standalone/public`. Otherwise it serves from `<project>/public`.
const CWD = process.cwd(); // should be the frontend project root
const STANDALONE_PUBLIC = path.join(CWD, ".next", "standalone", "public");
const PUBLIC_DIR = existsSync(STANDALONE_PUBLIC)
  ? STANDALONE_PUBLIC
  : path.join(CWD, "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads", "products");
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
  // include timestamp to avoid browser caching older image with same filename
  const timestamp = Date.now();
  const filename = `${position}-${timestamp}.${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);
  return `/uploads/products/${productId}/${filename}`;
}
