import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import {
  authRedirectToLocalePath,
  getLocaleForAuthRedirect,
  sameOriginRedirectUrl,
} from "@/lib/auth-redirect";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "login");
  const { allowed } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

  if (!allowed) {
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=too_many_attempts"),
      { status: 303 },
    );
  }

  const formData = await request.formData();

  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();
  const locale = await getLocaleForAuthRedirect(request, formData);

  if (!email || !password) {
    return NextResponse.redirect(
      sameOriginRedirectUrl(request, `/${locale}/account/profile?error=missing_fields`),
      { status: 303 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.redirect(
      sameOriginRedirectUrl(request, `/${locale}/account/profile?error=invalid_credentials`),
      { status: 303 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.redirect(
      sameOriginRedirectUrl(request, `/${locale}/account/profile?error=invalid_credentials`),
      { status: 303 },
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

  if (hasAdminAccess(user)) {
    return NextResponse.redirect(sameOriginRedirectUrl(request, "/admin"), { status: 303 });
  }

  return NextResponse.redirect(sameOriginRedirectUrl(request, `/${locale}`), { status: 303 });
}
