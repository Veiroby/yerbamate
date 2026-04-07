import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale, isValidLocale } from "@/lib/locale";

/** Absolute URL on the **same host** as the request (avoids NEXTAUTH_URL / PUBLIC_APP_ORIGIN mismatch on login). */
export function sameOriginRedirectUrl(request: Request, pathnameWithQuery: string): string {
  const reqUrl = new URL(request.url);
  const path = pathnameWithQuery.startsWith("/") ? pathnameWithQuery : `/${pathnameWithQuery}`;
  return new URL(path, `${reqUrl.protocol}//${reqUrl.host}`).toString();
}

/** Locale for post-login redirects: hidden form field, cookie, Referer, then default. */
export async function getLocaleForAuthRedirect(
  request: Request,
  formData?: FormData,
): Promise<Locale> {
  if (formData) {
    const hint = formData.get("locale")?.toString();
    if (hint !== undefined && isValidLocale(hint)) return hint;
  }

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
 * Build same-origin redirect URL under `[locale]`, e.g. account/profile?error=x.
 */
export async function authRedirectToLocalePath(
  request: Request,
  pathAfterLocale: string,
  formData?: FormData,
): Promise<string> {
  const locale = await getLocaleForAuthRedirect(request, formData);
  const trimmed = pathAfterLocale.replace(/^\//, "");
  const relative = trimmed ? `/${locale}/${trimmed}` : `/${locale}`;
  return sameOriginRedirectUrl(request, relative);
}
