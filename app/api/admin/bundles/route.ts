import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bundles = await prisma.bundleOffer.findMany({
    include: {
      product: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bundles });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, minQuantity, discountPercent, productId } = body;

    if (!name || !minQuantity || discountPercent === undefined) {
      return NextResponse.json(
        { error: "Name, minQuantity, and discountPercent are required" },
        { status: 400 },
      );
    }

    if (minQuantity < 2) {
      return NextResponse.json(
        { error: "Minimum quantity must be at least 2" },
        { status: 400 },
      );
    }

    if (discountPercent < 0 || discountPercent > 100) {
      return NextResponse.json(
        { error: "Discount percent must be between 0 and 100" },
        { status: 400 },
      );
    }

    const bundle = await prisma.bundleOffer.create({
      data: {
        name,
        description: description || null,
        minQuantity,
        discountPercent,
        productId: productId || null,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ bundle }, { status: 201 });
  } catch (error) {
    console.error("Error creating bundle offer:", error);
    return NextResponse.json(
      { error: "Failed to create bundle offer" },
      { status: 500 },
    );
  }
}
