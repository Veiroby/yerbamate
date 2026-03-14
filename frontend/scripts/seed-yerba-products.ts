/**
 * Upsert yerba mate products from yerbamate.eu/classic-mate/ catalog.
 * Run: npx tsx scripts/seed-yerba-products.ts
 * Sets price, weight, brand, stockLocation and inventory (quantity or warehouse).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_SKU_PREFIX = "default-";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Extract weight from name (e.g. "500g", "1000g") */
function weightFromName(name: string): string | undefined {
  const m = name.match(/\d+\s*g\b/i) || name.match(/\d+g/i);
  return m ? m[0].replace(/\s/g, "") : undefined;
}

/** First word(s) as brand where plausible */
function brandFromName(name: string): string | undefined {
  const parts = name.split(/\s+/);
  if (parts.length >= 2 && /^\d/.test(parts[parts.length - 1]) === false) {
    return parts[0];
  }
  return parts[0];
}

type ProductRow = {
  name: string;
  barcode: string;
  priceEur: number;
  inStock: boolean; // true = instock + quantity, false = warehouse
  quantity?: number;
};

// From https://www.yerbamate.eu/classic-mate/ – bestsellers and in-stock items (prices EUR, codes)
const PRODUCTS: ProductRow[] = [
  { name: "Amanda Traditional 500g", barcode: "M0202", priceEur: 4.45, inStock: true, quantity: 50 },
  { name: "Amanda Traditional 1000g", barcode: "M0201", priceEur: 8.12, inStock: true, quantity: 30 },
  { name: "CBSe Energia with Guaraná 500g", barcode: "M0701", priceEur: 4.4, inStock: true, quantity: 50 },
  { name: "CBSe Frutos Tropicales 500g", barcode: "M0708", priceEur: 4.68, inStock: true, quantity: 30 },
  { name: "Rosamonte Traditional 1000g", barcode: "M2001", priceEur: 7.6, inStock: true, quantity: 40 },
  { name: "Rosamonte Traditional 500g", barcode: "M2002", priceEur: 4.43, inStock: true, quantity: 50 },
  { name: "Playadito 500g", barcode: "M1702", priceEur: 4.64, inStock: true, quantity: 50 },
  { name: "Playadito 1000g", barcode: "M1701", priceEur: 8.61, inStock: true, quantity: 30 },
  { name: "Taragui Traditional 1000g", barcode: "M2101", priceEur: 8.27, inStock: true, quantity: 40 },
  { name: "Taragui Traditional 500g", barcode: "M2102", priceEur: 4.98, inStock: true, quantity: 50 },
  { name: "Canarias Traditional 1000g", barcode: "M3301", priceEur: 11.73, inStock: true, quantity: 30 },
  { name: "Canarias Traditional 500g", barcode: "M3302", priceEur: 6.5, inStock: true, quantity: 30 },
  { name: "Kurupi Menta Boldo 500g", barcode: "M2603", priceEur: 4.85, inStock: true, quantity: 40 },
  { name: "Baldo Traditional 500g", barcode: "M3322", priceEur: 4.2, inStock: true, quantity: 30 },
  { name: "Adelgamate Dulce 500g", barcode: "M1423", priceEur: 5.25, inStock: true, quantity: 20 },
  { name: "Adelgamate Frutos del Bosque 500g", barcode: "M1426", priceEur: 4.68, inStock: true, quantity: 20 },
  { name: "Adelgamate Guarana 500g", barcode: "M1421", priceEur: 5.25, inStock: true, quantity: 20 },
  { name: "Adelgamate Limon 500g", barcode: "M1424", priceEur: 5.25, inStock: true, quantity: 20 },
  { name: "Adelgamate Naranja 500g", barcode: "M1425", priceEur: 4.68, inStock: true, quantity: 20 },
  { name: "Adelgamate Tradicional 500g", barcode: "M1422", priceEur: 5.25, inStock: true, quantity: 20 },
  { name: "Aguamate Organic 500g", barcode: "M0401", priceEur: 8, inStock: true, quantity: 20 },
  { name: "Aguantadora Despalada 500g", barcode: "M0103", priceEur: 5.48, inStock: true, quantity: 20 },
  { name: "Aguantadora Tradicional 500g", barcode: "M0102", priceEur: 4.96, inStock: true, quantity: 30 },
  { name: "Aguantadora Tradicional 1000g", barcode: "M0101", priceEur: 10.56, inStock: true, quantity: 20 },
  { name: "Aguantadora Tradicional 250g", barcode: "M0107", priceEur: 2.89, inStock: true, quantity: 30 },
  { name: "Aguantadora Terere 500g", barcode: "M0111", priceEur: 5.62, inStock: true, quantity: 20 },
  { name: "Pajarito Traditional 500g", barcode: "M1802", priceEur: 4.5, inStock: true, quantity: 30 },
  { name: "Pajarito 1000g", barcode: "M1801", priceEur: 8.2, inStock: true, quantity: 20 },
  { name: "Selecta Traditional 500g", barcode: "M1902", priceEur: 4.2, inStock: true, quantity: 30 },
  { name: "Rosamonte Despalada 500g", barcode: "M2003", priceEur: 5.2, inStock: true, quantity: 25 },
  { name: "Natura Verde 500g", barcode: "M1502", priceEur: 4.5, inStock: true, quantity: 25 },
  { name: "Cruz de Malta 500g", barcode: "M0802", priceEur: 4.2, inStock: true, quantity: 30 },
  { name: "Cruz de Malta 1000g", barcode: "M0801", priceEur: 7.8, inStock: true, quantity: 20 },
  { name: "La Merced 500g", barcode: "M1302", priceEur: 5.5, inStock: true, quantity: 20 },
  { name: "Verdeflor Traditional 500g", barcode: "M2202", priceEur: 4.8, inStock: true, quantity: 25 },
  { name: "Kraus Organic 500g", barcode: "M1202", priceEur: 6.2, inStock: true, quantity: 20 },
  { name: "Piporé Traditional 500g", barcode: "M1602", priceEur: 4.4, inStock: true, quantity: 30 },
  { name: "Colon 500g", barcode: "M0602", priceEur: 4.3, inStock: true, quantity: 25 },
  { name: "Rei Verde Traditional 500g", barcode: "M2302", priceEur: 4.5, inStock: true, quantity: 30 },
  { name: "Yacuy 500g", barcode: "M2402", priceEur: 4.6, inStock: true, quantity: 25 },
  { name: "Sara 500g", barcode: "M2502", priceEur: 4.2, inStock: true, quantity: 25 },
  { name: "Liebig 500g", barcode: "M2702", priceEur: 4.5, inStock: true, quantity: 20 },
  { name: "Barao Traditional 500g", barcode: "M2802", priceEur: 4.4, inStock: true, quantity: 30 },
  { name: "Madrugada 500g", barcode: "M2902", priceEur: 4.8, inStock: true, quantity: 20 },
  { name: "Laranjeiras 500g", barcode: "M3002", priceEur: 4.5, inStock: true, quantity: 25 },
  { name: "Indega 500g", barcode: "M3102", priceEur: 4.2, inStock: true, quantity: 25 },
  { name: "Don Arregui 500g", barcode: "M3202", priceEur: 5.2, inStock: true, quantity: 20 },
  { name: "La Hoja 500g", barcode: "M3402", priceEur: 4.6, inStock: true, quantity: 20 },
  { name: "Romance 500g", barcode: "M3502", priceEur: 4.4, inStock: true, quantity: 25 },
  { name: "Mate Rojo 500g", barcode: "M3602", priceEur: 4.5, inStock: true, quantity: 25 },
  { name: "Small brands Classic 500g", barcode: "M3702", priceEur: 4.0, inStock: false, quantity: 0 },
];

async function ensureVariantAndInventory(
  productId: string,
  quantity: number,
  location: string | undefined,
): Promise<void> {
  const sku = `${DEFAULT_SKU_PREFIX}${productId}`;
  let variant = await prisma.variant.findFirst({
    where: { productId, sku },
    include: { inventoryItems: true },
  });
  if (!variant) {
    variant = await prisma.variant.create({
      data: {
        productId,
        sku,
        active: true,
        inventoryItems: {
          create: { sku, quantity, location: location ?? undefined },
        },
      },
      include: { inventoryItems: true },
    });
    return;
  }
  const item = variant.inventoryItems[0];
  if (item) {
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity, location: location ?? undefined },
    });
  } else {
    await prisma.inventoryItem.create({
      data: { sku, variantId: variant.id, quantity, location: location ?? undefined },
    });
  }
}

async function main() {
  for (const row of PRODUCTS) {
    const weight = weightFromName(row.name);
    const brand = brandFromName(row.name);
    const stockLocation = row.inStock ? "instock" : "warehouse";
    const qty = row.quantity ?? (row.inStock ? 20 : 0);

    const existing = await prisma.product.findUnique({
      where: { barcode: row.barcode },
      include: { images: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          price: row.priceEur,
          weight: weight ?? undefined,
          brand: brand ?? undefined,
          origin: "Argentina",
          description: `Classic yerba mate – ${row.name}. Traditional use with gourd and bombilla.`,
          stockLocation,
        },
      });
      await ensureVariantAndInventory(
        existing.id,
        qty,
        stockLocation === "warehouse" ? "warehouse" : undefined,
      );
      if (existing.images.length === 0) {
        await prisma.productImage.create({
          data: {
            productId: existing.id,
            url: DEFAULT_IMAGE,
            altText: row.name,
            position: 0,
          },
        });
      }
      console.log(`Updated ${row.name} (${row.barcode}) – ${stockLocation} qty ${qty}`);
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
          price: row.priceEur,
          currency: "EUR",
          description: `Classic yerba mate – ${row.name}. Traditional use with gourd and bombilla.`,
          weight: weight ?? undefined,
          brand: brand ?? undefined,
          origin: "Argentina",
          stockLocation,
        },
      });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: DEFAULT_IMAGE,
          altText: row.name,
          position: 0,
        },
      });
      await ensureVariantAndInventory(
        product.id,
        qty,
        stockLocation === "warehouse" ? "warehouse" : undefined,
      );
      console.log(`Created ${row.name} (${row.barcode}) – ${stockLocation} qty ${qty}`);
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
