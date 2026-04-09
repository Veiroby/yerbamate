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
  /** Present on some /v1/methods banklinks — use for Baltic filtering. */
  countries?: string[] | null;
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

function normalizeCountries(m: any): string[] | null {
  const raw = m?.countries;
  if (!Array.isArray(raw)) return null;
  const out = raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
  return out.length ? out : null;
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
      countries: normalizeCountries(m),
      max_amount: typeof m?.max_amount === "number" ? m.max_amount : null,
      min_amount: typeof m?.min_amount === "number" ? m.min_amount : null,
    });
  };

  const groups = ["banklinks", "cards", "paylater", "other"] as const;

  const roots: unknown[] = [];
  if (input && typeof input === "object") roots.push(input);
  const pm = input?.payment_methods ?? input?.paymentMethods;
  if (pm && typeof pm === "object") roots.push(pm);

  for (const root of roots) {
    if (!root || typeof root !== "object") continue;
    const r = root as Record<string, unknown>;
    for (const g of groups) {
      const arr = r[g];
      if (Array.isArray(arr)) for (const m of arr) push(m, g);
    }
  }

  const flatPm =
    input?.payment_methods ||
    input?.paymentMethods ||
    input?.methods ||
    input?.payment_methods?.methods;
  if (Array.isArray(flatPm)) {
    for (const m of flatPm) {
      push(
        {
          name: m?.name ?? m?.title ?? m?.display_name,
          code: m?.code ?? m?.id,
          display_name: m?.display_name ?? m?.title,
          url: m?.url,
          logo_url: m?.logo_url,
          country: m?.country,
          countries: m?.countries,
          max_amount: m?.max_amount,
          min_amount: m?.min_amount,
        },
        null,
      );
    }
  }

  const seen = new Set<string>();
  return out.filter((m) => {
    const k = `${m.category ?? ""}:${(m.code ?? m.name).toLowerCase()}:${m.url ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function methodDedupeKey(m: Method): string {
  const u = (m.url ?? "").trim().toLowerCase();
  if (u) return `url:${u}`;
  return `n:${(m.category ?? "")}:${(m.code ?? m.name).toLowerCase()}:${(m.country ?? "").toLowerCase()}`;
}

async function fetchMergedMethods(base: string, auth: string): Promise<Method[]> {
  const byKey = new Map<string, Method>();
  const urls = [`${base}/v1/methods`, `${base}/v1/shop/configuration`];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: auth, Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) continue;
      const methods = normalizeMethods(data);
      for (const m of methods) {
        const k = methodDedupeKey(m);
        if (!byKey.has(k)) byKey.set(k, m);
      }
    } catch {
      // try next
    }
  }

  return [...byKey.values()];
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
  const merged = await fetchMergedMethods(base, auth);

  if (merged.length > 0) {
    cache = { at: Date.now(), methods: merged };
    return NextResponse.json({ methods: merged }, { status: 200 });
  }

  cache = { at: Date.now(), methods: [] };
  return NextResponse.json({ methods: [] satisfies Method[] }, { status: 200 });
}
