import { NextResponse } from "next/server";
import { getAppleProfile, mergeAppleName } from "@/lib/oauth";
import { createSession, findOrCreateUserFromOAuth } from "@/lib/auth";

/** Apple uses response_mode=form_post, so callback is POST with code, id_token, and optionally user (name) */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/account/profile?error=oauth", request.url));
  }

  const code = formData.get("code")?.toString();
  const idToken = formData.get("id_token")?.toString() ?? null;
  const userStr = formData.get("user")?.toString(); // JSON with name on first sign-in only
  const error = formData.get("error")?.toString();

  if (error) {
    return NextResponse.redirect(new URL("/account/profile?error=denied", request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/account/profile?error=no_code", request.url));
  }

  try {
    let profile = await getAppleProfile(code, idToken, request);
    if (userStr) {
      try {
        const userJson = JSON.parse(userStr) as { name?: { firstName?: string; lastName?: string } };
        const first = userJson.name?.firstName ?? "";
        const last = userJson.name?.lastName ?? "";
        const fullName = [first, last].filter(Boolean).join(" ").trim() || null;
        profile = mergeAppleName(profile, fullName);
      } catch {
        // ignore parse error
      }
    }
    const userId = await findOrCreateUserFromOAuth(profile);
    await createSession(userId);
    return NextResponse.redirect(new URL("/account/profile", request.url));
  } catch (e) {
    console.error("Apple callback:", e);
    return NextResponse.redirect(new URL("/account/profile?error=oauth", request.url));
  }
}
