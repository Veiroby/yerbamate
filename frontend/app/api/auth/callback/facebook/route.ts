import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthRedirectUrl, getFacebookProfile } from "@/lib/oauth";
import { createSession, findOrCreateUserFromOAuth } from "@/lib/auth";
import { authRedirectToLocalePath, getLocaleForAuthRedirect } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=denied"),
    );
  }
  if (!code) {
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=no_code"),
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
      return NextResponse.redirect(getAuthRedirectUrl("/admin", request));
    }
    const locale = await getLocaleForAuthRedirect(request);
    return NextResponse.redirect(getAuthRedirectUrl(`/${locale}`, request));
  } catch (e) {
    console.error("Facebook callback:", e);
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=oauth"),
    );
  }
}
