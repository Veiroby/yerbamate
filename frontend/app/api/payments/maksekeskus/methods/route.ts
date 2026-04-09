import { NextResponse } from "next/server";
import { isMaksekeskusConfigured } from "@/lib/maksekeskus";

export type Method = {
  name: string;
  code?: string | null;
  display_name?: string | null;
  url?: string | null;
  logo_url?: string | null;
  category?: "banklinks" | "cards" | "paylater" | "other" | null;
  country?: string | null;
  max_amount?: number | null;
  min_amount?: number | null;
};

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

  const push = (m: any, category: Method["category"]) => {
    const name = typeof m?.name === "string" ? m.name.trim() : "";
    if (!name) return;
    out.push({
      name,
      code: typeof m?.code === "string" ? m.code : typeof m?.id === "string" ? m.id : null,
      display_name:
        typeof m?.display_name === "string"
          ? m.display_name
          : typeof m?.title === "string"
            ? m.title
            : null,
      url: typeof m?.url === "string" ? m.url : null,
      logo_url: typeof m?.logo_url === "string" ? m.logo_url : null,
      category,
      country: typeof m?.country === "string" ? m.country : null,
      max_amount: typeof m?.max_amount === "number" ? m.max_amount : null,
      min_amount: typeof m?.min_amount === "number" ? m.min_amount : null,
    });
  };

  // /v1/methods returns { banklinks: [], cards: [], paylater: [], other: [] }
  const groups = ["banklinks", "cards", "paylater", "other"] as const;
  for (const g of groups) {
    const arr = input?.[g];
    if (Array.isArray(arr)) for (const m of arr) push(m, g);
  }

  // /v1/shop/configuration shape can vary; try common keys.
  const pm =
    input?.payment_methods ||
    input?.paymentMethods ||
    input?.methods ||
    input?.payment_methods?.methods;
  if (Array.isArray(pm)) {
    for (const m of pm) {
      push(
        {
          name: m?.name ?? m?.title ?? m?.display_name,
          code: m?.code ?? m?.id,
          display_name: m?.display_name ?? m?.title,
          url: m?.url,
          logo_url: m?.logo_url,
          country: m?.country,
          max_amount: m?.max_amount,
          min_amount: m?.min_amount,
        },
        null,
      );
    }
  }

  // Deduplicate by (category, code) when possible; fallback to lowercase name.
  const seen = new Set<string>();
  return out.filter((m) => {
    const k = `${m.category ?? ""}:${(m.code ?? m.name).toLowerCase()}`;
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

