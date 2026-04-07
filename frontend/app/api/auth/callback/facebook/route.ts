import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFacebookProfile } from "@/lib/oauth";
import { createSession, findOrCreateUserFromOAuth } from "@/lib/auth";
import { authRedirectToLocalePath, getLocaleForAuthRedirect, sameOriginRedirectUrl } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=denied"),
      { status: 303 },
    );
  }
  if (!code) {
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=no_code"),
      { status: 303 },
    );
  }

  try {
    const profile = await getFacebookProfile(code, request);
    const userId = await findOrCreateUserFromOAuth(profile);
    await createSession(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (user?.isAdmin) {
      return NextResponse.redirect(sameOriginRedirectUrl(request, "/admin"), { status: 303 });
    }
    const locale = await getLocaleForAuthRedirect(request);
    return NextResponse.redirect(sameOriginRedirectUrl(request, `/${locale}`), { status: 303 });
  } catch (e) {
    console.error("Facebook callback:", e);
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=oauth"),
      { status: 303 },
    );
  }
}
