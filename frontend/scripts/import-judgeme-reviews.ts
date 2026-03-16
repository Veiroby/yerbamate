import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db";

type JudgemeRow = {
  title: string;
  body: string;
  rating: string;
  review_date: string;
  source: string;
  curated: string;
  reviewer_name: string;
  reviewer_email: string;
  product_id: string;
  product_handle: string;
  reply: string;
  reply_date: string;
  picture_urls: string;
  ip_address: string;
  location: string;
  metaobject_handle: string;
};

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error("Usage: pnpm import:reviews <path-to-judgeme-csv>");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  console.log(`Reading reviews from ${filePath}...`);

  const raw = await fs.readFile(filePath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as JudgemeRow[];

  console.log(`Parsed ${rows.length} rows from CSV.`);

  console.log("Deleting existing reviews (to remove old/fake ones)...");
  const deleteResult = await prisma.review.deleteMany({});
  console.log(`Deleted ${deleteResult.count} existing reviews.`);

  let imported = 0;
  let skippedNoProduct = 0;
  let skippedInvalidRating = 0;

  for (const row of rows) {
    const slug = (row.product_handle || "").trim();
    if (!slug) {
      skippedNoProduct++;
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      skippedNoProduct++;
      continue;
    }

    const rating = Number(row.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      skippedInvalidRating++;
      continue;
    }

    const authorEmail = (row.reviewer_email || "").trim().toLowerCase();
    const authorName = (row.reviewer_name || "").trim() || null;
    const title = (row.title || "").trim() || null;
    const body = (row.body || "").trim() || null;

    let createdAt: Date | undefined;
    if (row.review_date) {
      const d = new Date(row.review_date);
      if (!Number.isNaN(d.getTime())) {
        createdAt = d;
      }
    }

    await prisma.review.create({
      data: {
        productId: product.id,
        orderId: null,
        userId: null,
        authorEmail: authorEmail || "unknown@example.com",
        authorName,
        rating,
        title,
        body,
        status: "APPROVED",
        ...(createdAt ? { createdAt } : {}),
      },
    });

    imported++;
  }

  console.log(`Imported ${imported} reviews.`);
  console.log(`Skipped ${skippedNoProduct} rows with missing/unknown product.`);
  console.log(`Skipped ${skippedInvalidRating} rows with invalid rating.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

