import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/oauth";

export async function GET(request: Request) {
  try {
    const url = getGoogleAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Google OAuth init:", e);
    return NextResponse.redirect(new URL("/account/profile?error=oauth", request.url));
  }
}
