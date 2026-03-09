import { NextResponse } from "next/server";
import { getFacebookProfile } from "@/lib/oauth";
import { createSession, findOrCreateUserFromOAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/account/profile?error=denied", request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/account/profile?error=no_code", request.url));
  }

  try {
    const profile = await getFacebookProfile(code, request);
    const userId = await findOrCreateUserFromOAuth(profile);
    await createSession(userId);
    return NextResponse.redirect(new URL("/account/profile", request.url));
  } catch (e) {
    console.error("Facebook callback:", e);
    return NextResponse.redirect(new URL("/account/profile?error=oauth", request.url));
  }
}
