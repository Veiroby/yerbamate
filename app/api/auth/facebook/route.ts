import { NextResponse } from "next/server";
import { getFacebookAuthUrl } from "@/lib/oauth";

export async function GET(request: Request) {
  try {
    const url = getFacebookAuthUrl(request);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("Facebook OAuth init:", e);
    return NextResponse.redirect(new URL("/account/profile?error=oauth", request.url));
  }
}
