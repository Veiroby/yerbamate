import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "password_too_short" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "password_needs_uppercase" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "password_needs_lowercase" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "password_needs_number" };
  }
  return { valid: true };
}

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "reset-password");
  const { allowed } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

  if (!allowed) {
    return NextResponse.redirect(
      new URL("/account/reset-password?error=too_many_attempts", request.url),
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();

  if (!token || !password) {
    return NextResponse.redirect(
      new URL("/account/reset-password?error=missing_fields", request.url),
      { status: 303 }
    );
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return NextResponse.redirect(
      new URL(`/account/reset-password?token=${token}&error=${passwordCheck.error}`, request.url),
      { status: 303 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/account/reset-password?error=invalid_token", request.url),
      { status: 303 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  await createSession(user.id);

  return NextResponse.redirect(
    new URL("/account/profile?status=password_reset", request.url),
    { status: 303 }
  );
}
