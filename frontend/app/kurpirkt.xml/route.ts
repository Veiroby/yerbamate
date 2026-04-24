import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.yerbatea.lv";
const FEED_TITLE = "YerbaTea Product Feed";
const FEED_DESCRIPTION = "YerbaTea product feed for kurpirkt.lv";
const FEED_LINK = `${BASE_URL}/lv/products`;

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

function availabilityFromStock(stockLocation: string | null, quantityLeft: number): "in stock" | "out of stock" {
  if (stockLocation === "warehouse") return "in stock";
  return quantityLeft > 0 ? "in stock" : "out of stock";
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      archived: false,
      isDraft: false,
    },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: {
        include: {
          inventoryItems: {
            select: { quantity: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const itemsXml = products
    .map((product) => {
      const quantityLeft = product.variants.reduce(
        (sum, v) => sum + v.inventoryItems.reduce((acc, i) => acc + i.quantity, 0),
        0,
      );
      const availability = availabilityFromStock(product.stockLocation, quantityLeft);
      const imageUrl = product.images[0]?.url ?? `${BASE_URL}/images/placeholder-product.png`;
      const link = `${BASE_URL}/lv/products/${encodeURIComponent(product.slug)}`;
      const description =
        product.descriptionLv?.trim() ||
        product.descriptionEn?.trim() ||
        product.description?.trim() ||
        product.name;

      return `
    <item>
      <g:id>${xmlEscape(product.id)}</g:id>
      <title>${xmlEscape(product.name)}</title>
      <description>${xmlEscape(description)}</description>
      <link>${xmlEscape(link)}</link>
      <g:image_link>${xmlEscape(imageUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${formatPrice(Number(product.price), product.currency)}</g:price>
      <g:condition>new</g:condition>
      ${product.brand ? `<g:brand>${xmlEscape(product.brand)}</g:brand>` : ""}
      ${product.barcode ? `<g:gtin>${xmlEscape(product.barcode)}</g:gtin>` : ""}
      ${product.category?.name ? `<g:product_type>${xmlEscape(product.category.name)}</g:product_type>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${FEED_TITLE}</title>
    <description>${FEED_DESCRIPTION}</description>
    <link>${FEED_LINK}</link>${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}

