/**
 * OAuth 2.0 helpers for Google, Facebook, and Apple.
 * Uses authorization code flow; callbacks create/update User and Account and set session.
 */

import { getRequestOrigin } from "@/lib/request-origin";

const SCOPES = {
  google: "openid email profile",
  facebook: "email public_profile",
  apple: "name email",
} as const;

export type OAuthProvider = "google" | "facebook" | "apple";

export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

/**
 * OAuth redirect URIs and token-exchange redirect_uri must match the host the user used.
 * When `request` is present, always derive from the request (and x-forwarded-*), not NEXTAUTH_URL—
 * otherwise production can send users to localhost if env is wrong.
 */
export function getBaseUrl(request?: Request): string {
  if (request) {
    return getRequestOrigin(request);
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (typeof nextAuthUrl === "string" && nextAuthUrl.trim()) {
    return normalizeOrigin(nextAuthUrl);
  }

  const publicOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (typeof publicOrigin === "string" && publicOrigin.trim()) {
    return normalizeOrigin(publicOrigin);
  }

  return "http://localhost:3000";
}

export function getAuthRedirectUrl(path: string, request?: Request): string {
  return new URL(path, getBaseUrl(request)).toString();
}

/** Build Google authorization URL */
export function getGoogleAuthUrl(request?: Request): string {
  const base = getBaseUrl(request);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${base}/api/auth/callback/google`,
    response_type: "code",
    scope: SCOPES.google,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchange Google code for tokens and fetch profile */
export async function getGoogleProfile(code: string, request?: Request): Promise<OAuthProfile> {
  const base = getBaseUrl(request);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${base}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${t}`);
  }
  const tokens = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) throw new Error("Google userinfo failed");
  const user = (await userRes.json()) as { id: string; email?: string; name?: string; picture?: string };
  return {
    provider: "google",
    providerAccountId: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.picture ?? null,
  };
}

/** Build Facebook authorization URL */
export function getFacebookAuthUrl(request?: Request): string {
  const base = getBaseUrl(request);
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) throw new Error("FACEBOOK_APP_ID is not set");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${base}/api/auth/callback/facebook`,
    response_type: "code",
    scope: SCOPES.facebook,
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/** Exchange Facebook code for access token and fetch profile */
export async function getFacebookProfile(code: string, request?: Request): Promise<OAuthProfile> {
  const base = getBaseUrl(request);
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Facebook OAuth not configured");

  const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", `${base}/api/auth/callback/facebook`);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString());
  if (!tokenRes.ok) throw new Error("Facebook token exchange failed");
  const tokens = (await tokenRes.json()) as { access_token: string };

  const userUrl = new URL("https://graph.facebook.com/me");
  userUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  userUrl.searchParams.set("access_token", tokens.access_token);
  const userRes = await fetch(userUrl.toString());
  if (!userRes.ok) throw new Error("Facebook me failed");
  const user = (await userRes.json()) as {
    id: string;
    email?: string;
    name?: string;
    picture?: { data?: { url?: string } };
  };
  const image = user.picture?.data?.url ?? null;
  return {
    provider: "facebook",
    providerAccountId: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image,
  };
}

/** Build Apple authorization URL */
export function getAppleAuthUrl(request?: Request): string {
  const base = getBaseUrl(request);
  const clientId = process.env.APPLE_CLIENT_ID; // Services ID (e.g. com.yourapp.service)
  if (!clientId) throw new Error("APPLE_CLIENT_ID is not set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${base}/api/auth/callback/apple`,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: SCOPES.apple,
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

/** Create Apple client_secret JWT (valid 6 months) */
async function getAppleClientSecret(): Promise<string> {
  const { SignJWT } = await import("jose");
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const privateKeyPem = process.env.APPLE_PRIVATE_KEY;

  if (!teamId || !keyId || !clientId || !privateKeyPem) {
    throw new Error("Apple OAuth not configured (APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY)");
  }

  const key = await import("jose").then((jose) =>
    jose.importPKCS8(privateKeyPem.replace(/\\n/g, "\n"), "ES256")
  );
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime(Math.floor(Date.now() / 1000) + 86400 * 180) // 6 months
    .sign(key);
  return jwt;
}

/**
 * Exchange Apple code for tokens and decode id_token for profile.
 * On first sign-in, name/email may be in the form body from Apple (user object).
 */
export async function getAppleProfile(
  code: string,
  idToken: string | null,
  request?: Request
): Promise<OAuthProfile> {
  const base = getBaseUrl(request);
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = await getAppleClientSecret();
  if (!clientId) throw new Error("Apple OAuth not configured");

  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${base}/api/auth/callback/apple`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    throw new Error(`Apple token exchange failed: ${t}`);
  }
  const tokens = (await tokenRes.json()) as { id_token?: string; access_token?: string };
  const jwt = tokens.id_token ?? idToken;
  if (!jwt) throw new Error("Apple id_token missing");

  const { decodeJwt } = await import("jose");
  const payload = decodeJwt(jwt) as { sub: string; email?: string };
  return {
    provider: "apple",
    providerAccountId: payload.sub,
    email: payload.email ?? null,
    name: null, // Apple may send name only once in form_post; we don't have it here
    image: null,
  };
}

/** Merge name from Apple's first-sign-in form into profile if provided */
export function mergeAppleName(profile: OAuthProfile, nameFromForm: string | null): OAuthProfile {
  if (profile.provider !== "apple" || !nameFromForm?.trim()) return profile;
  return { ...profile, name: nameFromForm.trim() || profile.name };
}
