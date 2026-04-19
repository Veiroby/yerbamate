import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import {
  authRedirectToLocalePath,
  getLocaleForAuthRedirect,
  sameOriginRedirectUrl,
} from "@/lib/auth-redirect";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { hasAdminAccess } from "@/lib/admin-access";

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain an uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain a lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain a number" };
  }
  return { valid: true };
}

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "register");
  const { allowed } = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);

  if (!allowed) {
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=too_many_attempts"),
      { status: 303 },
    );
  }

  const formData = await request.formData();

  const email = formData.get("email")?.toString().toLowerCase().trim();
  const name = formData.get("name")?.toString().trim();
  const password = formData.get("password")?.toString();
  const locale = await getLocaleForAuthRedirect(request, formData);

  if (!email || !password) {
    return NextResponse.redirect(
      sameOriginRedirectUrl(request, `/${locale}/account/profile?error=register_missing_fields`),
      { status: 303 },
    );
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    const errorCode =
      password.length < 8
        ? "password_too_short"
        : !/[A-Z]/.test(password)
          ? "password_needs_uppercase"
          : !/[a-z]/.test(password)
            ? "password_needs_lowercase"
            : "password_needs_number";
    return NextResponse.redirect(
      sameOriginRedirectUrl(request, `/${locale}/account/profile?error=${errorCode}`),
      { status: 303 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing && existing.passwordHash) {
    return NextResponse.redirect(
      sameOriginRedirectUrl(request, `/${locale}/account/profile?error=email_exists`),
      { status: 303 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: name || existing?.name,
      passwordHash,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });

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

  if (hasAdminAccess(user)) {
    return NextResponse.redirect(sameOriginRedirectUrl(request, "/admin"), { status: 303 });
  }

  return NextResponse.redirect(sameOriginRedirectUrl(request, `/${locale}`), { status: 303 });
}
