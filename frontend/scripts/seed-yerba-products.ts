/**
 * Upsert yerba mate products from the catalog: barcode, name, one image each.
 * Run: npx tsx scripts/seed-yerba-products.ts
 * Does not set prices (use admin to set prices).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const PRODUCTS: { name: string; barcode: string; imageUrl: string }[] = [
  { name: "Amanda Traditional 500g", barcode: "M0202", imageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600" },
  { name: "Baldo traditional 500g", barcode: "M3322", imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600" },
  { name: "CBSe Energia with Guaraná 500g", barcode: "M0701", imageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600" },
  { name: "CBSe Frutos Tropicales 500g", barcode: "M0708", imageUrl: "https://images.unsplash.com/photo-1563822249368-1c91bb269b2b?w=600" },
  { name: "Canarias Traditional 500g", barcode: "M3302", imageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600" },
  { name: "Canarias Traditional 1000g", barcode: "M3301", imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600" },
  { name: "Playadito 500g", barcode: "M1702", imageUrl: "https://images.unsplash.com/photo-1563822249368-1c91bb269b2b?w=600" },
  { name: "Rosamonte Traditional 500g", barcode: "M2002", imageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600" },
  { name: "Taragui Traditional 500g", barcode: "M2102", imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600" },
];

async function main() {
  for (const row of PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { barcode: row.barcode },
      include: { images: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name: row.name },
      });
      const productId = existing.id;
      if (existing.images.length === 0) {
        await prisma.productImage.create({
          data: {
            productId,
            url: row.imageUrl,
            altText: row.name,
            position: 0,
          },
        });
        console.log(`Updated ${row.name} (${row.barcode}), added image.`);
      } else {
        console.log(`Updated ${row.name} (${row.barcode}).`);
      }
    } else {
      const slugBase = slugify(row.name);
      let slug = slugBase;
      let n = 0;
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${slugBase}-${++n}`;
      }
      const product = await prisma.product.create({
        data: {
          name: row.name,
          slug,
          barcode: row.barcode,
          price: 1,
          currency: "EUR",
          description: `Yerba mate ${row.name}.`,
        },
      });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: row.imageUrl,
          altText: row.name,
          position: 0,
        },
      });
      console.log(`Created ${row.name} (${row.barcode}) with image.`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
