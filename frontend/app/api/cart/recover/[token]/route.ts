import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markRecoveryAsRecoveredByToken } from "@/lib/abandoned-cart";

type RouteParams = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const recovery = await prisma.abandonedCartRecovery.findUnique({
    where: { recoveryToken: token },
    select: { sessionId: true, status: true },
  });
  if (!recovery?.sessionId) {
    return NextResponse.redirect(new URL("/cart", request.url), 303);
  }

  (await cookies()).set("cart_session_id", recovery.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (recovery.status !== "CONVERTED") {
    await markRecoveryAsRecoveredByToken(token);
  }
  return NextResponse.redirect(new URL("/cart", request.url), 303);
}
