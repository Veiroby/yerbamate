import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("cart_session_id")?.value;
  if (existing) return existing;
  const sessionId = randomUUID();
  cookieStore.set("cart_session_id", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return sessionId;
}

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "cart-add");
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 30, 60 * 1000);
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before adding more items." },
      { 
        status: 429, 
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } 
      }
    );
  }

  const sessionId = await getOrCreateSessionId();
  const formData = await request.formData();

  const productId = formData.get("productId")?.toString();
  const quantityRaw = formData.get("quantity")?.toString() ?? "1";

  const quantity = Number.parseInt(quantityRaw, 10);

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "Invalid product or quantity" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.active || product.archived) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const cart =
    (await prisma.cart.findUnique({ where: { sessionId } })) ??
    (await prisma.cart.create({
      data: { sessionId },
    }));

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: product.id,
      variantId: null,
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      },
    });
  }

  await recordEvent("add_to_cart", {
    sessionId,
    payload: {
      productId: product.id,
      productName: product.name,
      quantity,
      currency: product.currency,
      value: Number(product.price) * quantity,
    },
  });

  // Check if the client wants a JSON response (for fetch-based add-to-cart)
  const acceptHeader = request.headers.get("Accept") ?? "";
  if (acceptHeader.includes("application/json")) {
    // Get updated cart item count
    const updatedCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
    const cartItemCount = updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return NextResponse.json({
      success: true,
      productId: product.id,
      productName: product.name,
      quantity,
      cartItemCount,
    });
  }

  // For form submissions, redirect as before
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect");
  const isAllowedRedirect =
    redirectTo === "/checkout" || redirectTo === "/cart" || redirectTo === "";
  const target = isAllowedRedirect && redirectTo ? redirectTo : "/cart";

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? new URL(request.url).origin;
  const redirectUrl = new URL(target, origin).toString();

  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}

