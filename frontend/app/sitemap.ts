import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const baseUrl = "https://www.yerbatea.lv";
const locales = ["lv", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date().toISOString();

  const staticPaths = [
    "/about",
    "/contact",
    "/products",
    "/yerba-mate",
    "/mate-gourds",
    "/accessories",
    "/privacy",
    "/terms",
    "/shipping-policy",
  ];

  const [products] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const productUrls = products.flatMap((p) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/products/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt?.toISOString() ?? lastModified,
    })),
  );

  const staticUrls = locales.flatMap((locale) =>
    staticPaths.map((p) => ({
      url: `${baseUrl}/${locale}${p}`,
      lastModified,
    })),
  );

  const homeUrls = locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified,
  }));

  return [...homeUrls, ...staticUrls, ...productUrls];
}

