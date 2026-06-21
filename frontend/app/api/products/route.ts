import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma/client";
import { mateGourdsCategoryWhere } from "@/lib/category-filters";
import { sortCatalogProducts } from "@/lib/catalog-sort";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const origin = searchParams.get("origin");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");
  const limitRaw = searchParams.get("limit");
  let take: number | undefined;
  if (limitRaw != null && limitRaw !== "") {
    const n = parseInt(limitRaw, 10);
    if (!Number.isNaN(n) && n > 0) {
      take = Math.min(n, 50);
    }
  }

  const where: Prisma.ProductWhereInput = {
    active: true,
    archived: false,
    isDraft: false,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { descriptionEn: { contains: q, mode: "insensitive" } },
      { descriptionLv: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { origin: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category =
      category === "mate-gourds"
        ? mateGourdsCategoryWhere()
        : { slug: category };
  }

  if (brand) {
    where.brand = brand;
  }

  if (origin) {
    where.origin = origin;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice);
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "name-asc":
      orderBy = { name: "asc" };
      break;
    case "name-desc":
      orderBy = { name: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    ...(take != null ? { take } : {}),
    include: {
      category: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
      },
      variants: { include: { inventoryItems: true } },
    },
  });

  const withStock = products.map((p) => {
    const quantityLeft = p.variants.reduce(
      (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
      0,
    );
    return {
      product: p,
      quantityLeft,
      stockLocation: p.stockLocation ?? "instock",
      isBestseller: p.isBestseller,
      bestsellerRank: p.bestsellerRank,
      catalogSortOrder: p.catalogSortOrder,
      name: p.name,
    };
  });

  const sorted = sortCatalogProducts(withStock).map((row) => row.product);

  return NextResponse.json({ products: sorted });
}
