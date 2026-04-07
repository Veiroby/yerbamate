import { NextResponse } from "next/server";
import { getAppleAuthUrl } from "@/lib/oauth";
import { authRedirectToLocalePath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  try {
    const url = getAppleAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Apple OAuth init:", e);
    return NextResponse.redirect(
      await authRedirectToLocalePath(request, "account/profile?error=oauth"),
      { status: 303 },
    );
  }
}
