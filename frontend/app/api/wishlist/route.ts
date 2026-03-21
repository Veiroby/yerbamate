import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ productIds: [] });
  }
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  return NextResponse.json({
    productIds: items.map((i) => i.productId),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { productId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, active: true, archived: true },
  });
  if (!product || !product.active || product.archived) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId: user.id, productId },
    },
    create: { userId: user.id, productId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });
  return NextResponse.json({ ok: true });
}
