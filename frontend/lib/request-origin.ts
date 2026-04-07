/**
 * Public origin for the current HTTP request.
 * Uses x-forwarded-* then Host header so OAuth + post-login redirects match the browser
 * (not internal 127.0.0.1, and not a wrong NEXTAUTH_URL).
 */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto =
      forwardedProto && forwardedProto.length > 0 ? forwardedProto : "https";
    return `${proto}://${forwardedHost}`;
  }

  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  try {
    const u = new URL(request.url);
    const host = hostHeader ?? u.host;
    if (!host) return "http://localhost:3000";

    const proto =
      forwardedProto && forwardedProto.length > 0
        ? forwardedProto
        : u.protocol === "https:"
          ? "https"
          : "http";
    return `${proto}://${host}`;
  } catch {
    if (hostHeader) return `https://${hostHeader}`;
    return "http://localhost:3000";
  }
}
