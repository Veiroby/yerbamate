import { NextResponse } from "next/server";
import { getFacebookAuthUrl } from "@/lib/oauth";
import { authRedirectToLocalePath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  try {
    const url = getFacebookAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Facebook OAuth init:", e);
    return NextResponse.redirect(await authRedirectToLocalePath(request, "account/profile?error=oauth"));
  }
}
