import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableShippingMethods } from "@/lib/shipping/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") ?? "US";
  const locale = url.searchParams.get("locale") as "lv" | "en" | null;
  const subtotalParam = url.searchParams.get("subtotal");
  const orderSubtotal = subtotalParam != null ? Number(subtotalParam) : null;

  const sessionId = (await cookies()).get("cart_session_id")?.value;

  const cart = sessionId
    ? await prisma.cart.findUnique({
        where: { sessionId },
      })
    : null;

  const methods = await getAvailableShippingMethods(
    { country },
    cart ? { id: cart.id } : null,
    Number.isFinite(orderSubtotal) ? orderSubtotal : undefined,
    locale ?? undefined,
  );

  return NextResponse.json({
    methods,
    unsupportedCountry: methods.length === 0,
  });
}

