import { NextResponse } from "next/server";
import { getAppleAuthUrl, getAuthRedirectUrl } from "@/lib/oauth";

export async function GET(request: Request) {
  try {
    const url = getAppleAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Apple OAuth init:", e);
    return NextResponse.redirect(getAuthRedirectUrl("/account/profile?error=oauth", request));
  }
}
