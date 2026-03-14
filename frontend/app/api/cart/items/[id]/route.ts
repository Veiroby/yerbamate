import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const sessionId = (await cookies()).get("cart_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "No cart found" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const item = cart.items.find((i) => i.id === id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const body = await request.json();
  const { quantity } = body;

  if (!Number.isFinite(quantity) || quantity < 0) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  return NextResponse.json({ success: true, item: updatedItem });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const sessionId = (await cookies()).get("cart_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "No cart found" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const item = cart.items.find((i) => i.id === id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
