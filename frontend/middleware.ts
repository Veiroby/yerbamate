import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isValidLocale } from "./lib/locale";

const LOCALE_PREFIX = "/:locale(lv|en)";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API, admin, and static
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url), 302);
  }

  if (isValidLocale(first)) {
    const res = NextResponse.next();
    res.cookies.set("NEXT_LOCALE", first, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // e.g. /products -> /lv/products
  const newUrl = new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url);
  return NextResponse.redirect(newUrl, 302);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
