import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { brand: true, origin: true, price: true },
    }),
  ]);

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[];
  const origins = [...new Set(products.map((p) => p.origin).filter(Boolean))] as string[];

  const prices = products.map((p) => Number(p.price));
  const priceRange = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 100,
  };

  return NextResponse.json({
    categories,
    brands: brands.sort(),
    origins: origins.sort(),
    priceRange,
  });
}
