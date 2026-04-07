import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/oauth";
import { authRedirectToLocalePath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  try {
    const url = getGoogleAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Google OAuth init:", e);
    return NextResponse.redirect(await authRedirectToLocalePath(request, "account/profile?error=oauth"));
  }
}
