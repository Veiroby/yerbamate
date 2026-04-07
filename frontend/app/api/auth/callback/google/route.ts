import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthRedirectUrl, getGoogleProfile } from "@/lib/oauth";
import { createSession, findOrCreateUserFromOAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(getAuthRedirectUrl("/account/profile?error=denied", request));
  }
  if (!code) {
    return NextResponse.redirect(getAuthRedirectUrl("/account/profile?error=no_code", request));
  }

  try {
    const profile = await getGoogleProfile(code, request);
    const userId = await findOrCreateUserFromOAuth(profile);
    await createSession(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    const path = user?.isAdmin ? "/admin" : "/auth/continuing";
    return NextResponse.redirect(getAuthRedirectUrl(path, request));
  } catch (e) {
    console.error("Google callback:", e);
    return NextResponse.redirect(getAuthRedirectUrl("/account/profile?error=oauth", request));
  }
}
