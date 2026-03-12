import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "forgot-password");
  const { allowed } = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000);

  if (!allowed) {
    return NextResponse.redirect(
      new URL("/account/forgot-password?status=sent", request.url),
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString().toLowerCase().trim();

  if (!email) {
    return NextResponse.redirect(
      new URL("/account/forgot-password?error=missing_email", request.url),
      { status: 303 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && user.passwordHash) {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const siteOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
    const resetUrl = `${siteOrigin}/account/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail({
      email: user.email,
      resetUrl,
    });
  }

  return NextResponse.redirect(
    new URL("/account/forgot-password?status=sent", request.url),
    { status: 303 }
  );
}
