import type { NextConfig } from "next";
import path from "node:path";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://editor.unlayer.com https://*.unlayer.com https://www.instagram.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://*.maksekeskus.ee https://*.makecommerce.net https://*.makecommerce.ee https://*.cdninstagram.com https://*.fbcdn.net https://*.instagram.com",
  // Perplexity browser extension injects fonts on the page; allow to avoid noisy CSP console errors.
  "font-src 'self' data: https://fonts.gstatic.com https://r2cdn.perplexity.ai",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com https://eserviss.dpd.lv https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://editor.unlayer.com https://*.unlayer.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://editor.unlayer.com https://*.unlayer.com https://www.instagram.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://hooks.stripe.com",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

/** Telegram Mini App embeds /tg in web.telegram.org (and related) iframes/WebViews. */
const telegramMiniAppHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Intentionally omit X-Frame-Options — it blocks Telegram embedding.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      ...cspDirectives,
      "frame-ancestors 'self' https://web.telegram.org https://webk.telegram.org https://webz.telegram.org https://telegram.org https://*.telegram.org",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Use this directory as workspace root so Next doesn't infer parent (multiple lockfiles).
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  async headers() {
    return [
      // Mini App routes first — must not inherit store X-Frame-Options: SAMEORIGIN.
      {
        source: "/tg",
        headers: telegramMiniAppHeaders,
      },
      {
        source: "/tg/:path*",
        headers: telegramMiniAppHeaders,
      },
      // Storefront + APIs: keep clickjacking protection. Exclude /tg via negative lookahead
      // so Next does not merge X-Frame-Options onto Mini App responses.
      {
        source: "/((?!tg(?:/.*)?$).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
