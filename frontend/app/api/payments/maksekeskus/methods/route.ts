import { NextResponse } from "next/server";
import { isMaksekeskusConfigured } from "@/lib/maksekeskus";

type Method = { name: string; code?: string | null };

let cache: { at: number; methods: Method[] } | null = null;
const CACHE_MS = 15 * 60 * 1000;

function baseUrl(): string {
  const raw = process.env.MAKSEKESKUS_BASE_URL?.trim();
  if (raw) return raw.replace(/\s+/g, "").replace(/\/+$/, "");
  return process.env.NODE_ENV === "production"
    ? "https://api.maksekeskus.ee"
    : "https://api.test.maksekeskus.ee";
}

function basicAuthHeader(): string | null {
  const shopId = process.env.MAKSEKESKUS_SHOP_ID;
  const secretKey = process.env.MAKSEKESKUS_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

function normalizeMethods(input: any): Method[] {
  const out: Method[] = [];
  const push = (name: unknown, code?: unknown) => {
    const n = typeof name === "string" ? name.trim() : "";
    if (!n) return;
    out.push({ name: n, code: typeof code === "string" ? code : null });
  };

  // Prefer /v1/shop/configuration payment method list when available.
  const pm =
    input?.payment_methods ||
    input?.paymentMethods ||
    input?.methods ||
    input?.payment_methods?.methods;

  if (Array.isArray(pm)) {
    for (const m of pm) push(m?.name ?? m?.title ?? m?.display_name, m?.code ?? m?.id);
  } else if (pm && typeof pm === "object") {
    // Sometimes grouped by country.
    for (const v of Object.values(pm)) {
      if (Array.isArray(v)) for (const m of v) push((m as any)?.name ?? (m as any)?.title, (m as any)?.code ?? (m as any)?.id);
    }
  }

  // Deduplicate by lowercase name.
  const seen = new Set<string>();
  return out.filter((m) => {
    const k = m.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function GET() {
  if (!isMaksekeskusConfigured()) {
    return NextResponse.json({ methods: [] satisfies Method[] }, { status: 200 });
  }
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json({ methods: cache.methods }, { status: 200 });
  }

  const auth = basicAuthHeader();
  if (!auth) return NextResponse.json({ methods: [] satisfies Method[] }, { status: 200 });

  const base = baseUrl();
  const urls = [
    `${base}/v1/shop/configuration`,
    `${base}/v1/methods`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: auth, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) continue;
      const methods = normalizeMethods(data);
      if (methods.length > 0) {
        cache = { at: Date.now(), methods };
        return NextResponse.json({ methods }, { status: 200 });
      }
    } catch {
      // try next
    }
  }

  cache = { at: Date.now(), methods: [] };
  return NextResponse.json({ methods: [] satisfies Method[] }, { status: 200 });
}

