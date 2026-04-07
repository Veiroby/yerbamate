import { cookies } from "next/headers";
import { getAuthRedirectUrl } from "@/lib/oauth";
import { DEFAULT_LOCALE, type Locale, isValidLocale } from "@/lib/locale";

/** Locale for post-login redirects: cookie from browsing session, then Referer, then default. */
export async function getLocaleForAuthRedirect(request: Request): Promise<Locale> {
  const store = await cookies();
  const fromCookie = store.get("NEXT_LOCALE")?.value;
  if (fromCookie !== undefined && isValidLocale(fromCookie)) return fromCookie;

  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const first = new URL(ref).pathname.split("/").filter(Boolean)[0];
      if (isValidLocale(first)) return first;
    } catch {
      /* ignore */
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Build absolute redirect URL under `[locale]` routes, e.g. account/profile?error=x or "" for home.
 * Admin and other non-localized paths must use getAuthRedirectUrl("/admin", request) directly.
 */
export async function authRedirectToLocalePath(
  request: Request,
  pathAfterLocale: string,
): Promise<string> {
  const locale = await getLocaleForAuthRedirect(request);
  const trimmed = pathAfterLocale.replace(/^\//, "");
  const relative = trimmed ? `/${locale}/${trimmed}` : `/${locale}`;
  return getAuthRedirectUrl(relative, request);
}
