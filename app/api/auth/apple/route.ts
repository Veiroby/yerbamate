import { NextResponse } from "next/server";
import { getAppleAuthUrl } from "@/lib/oauth";

export async function GET(request: Request) {
  try {
    const url = getAppleAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Apple OAuth init:", e);
    return NextResponse.redirect(new URL("/account/profile?error=oauth", request.url));
  }
}
