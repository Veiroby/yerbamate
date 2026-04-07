import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("cart_session_id")?.value;
  if (existing) return existing;
  const sessionId = randomUUID();
  cookieStore.set("cart_session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return sessionId;
}

export async function GET() {
  const sessionId = await getOrCreateSessionId();

  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          product: {
            include: {
              images: { orderBy: { position: "asc" }, take: 1 },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    return NextResponse.json({ cart: null });
  }

  return NextResponse.json({ cart });
}

export async function PATCH(request: Request) {
  const sessionId = await getOrCreateSessionId();
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({ where: { sessionId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { email: email || undefined },
  });
  return NextResponse.json({ ok: true });
}

