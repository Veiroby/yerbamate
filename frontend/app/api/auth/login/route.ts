import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { getAuthRedirectUrl } from "@/lib/oauth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "login");
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
  
  if (!allowed) {
    return NextResponse.redirect(
      getAuthRedirectUrl("/account/profile?error=too_many_attempts", request),
      { status: 303 }
    );
  }

  const formData = await request.formData();

  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return NextResponse.redirect(
      getAuthRedirectUrl("/account/profile?error=missing_fields", request),
      { status: 303 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.redirect(
      getAuthRedirectUrl("/account/profile?error=invalid_credentials", request),
      { status: 303 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.redirect(
      getAuthRedirectUrl("/account/profile?error=invalid_credentials", request),
      { status: 303 }
    );
  }

  await prisma.order.updateMany({
    where: {
      email: user.email,
      userId: null,
    },
    data: {
      userId: user.id,
    },
  });

  await createSession(user.id);

  const redirectTo = user.isAdmin ? "/admin" : "/account/orders";
  return NextResponse.redirect(getAuthRedirectUrl(redirectTo, request), {
    status: 303,
  });
}

