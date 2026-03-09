import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: { position: "asc" },
        take: 1,
      },
    },
  });

  return NextResponse.json({ products });
}

