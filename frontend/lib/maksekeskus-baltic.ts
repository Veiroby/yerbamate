export function shippingCountryToIso2(ship: string): string {
  return String(ship ?? "")
    .trim()
    .toLowerCase();
}

/** Normalize API / form country tokens to ISO 639... no, ISO 3166-1 alpha-2 lower-case. */
export function normalizeMakseCountryToken(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.length === 2) return s;
  const a3: Record<string, string> = { lva: "lv", est: "ee", ltu: "lt" };
  if (a3[s]) return a3[s];
  if (s === "latvia" || s === "latvija") return "lv";
  if (s === "estonia" || s === "eesti") return "ee";
  if (s === "lithuania" || s === "lietuva") return "lt";
  return null;
}

export function collectMethodCountryCodes(m: {
  country?: string | null;
  countries?: string[] | null;
}): string[] {
  const out: string[] = [];
  if (Array.isArray(m.countries)) {
    for (const c of m.countries) {
      const n = normalizeMakseCountryToken(typeof c === "string" ? c : "");
      if (n) out.push(n);
    }
  }
  const single = normalizeMakseCountryToken(m.country ?? null);
  if (single) out.push(single);
  return [...new Set(out)];
}

/** Best-effort when API omits country (rare); avoids matching LV to EE banks. */
export function inferBanklinkCountryFromStrings(parts: string[]): string | null {
  const blob = parts.join(" ").toLowerCase();
  if (/\blv\b|\.lv|latvia|latvij|swedbank\.lv|citadele\.lv|luminor\.lv|seb\.lv/i.test(blob))
    return "lv";
  if (/\bee\b|\.ee|eesti|estonia|lhv|coop|swedbank\.ee|seb\.ee/i.test(blob)) return "ee";
  if (/\blt\b|\.lt|lithuania|lietuv|swedbank\.lt|seb\.lt|luminor\.lt/i.test(blob)) return "lt";
  return null;
}

export function makseCustomerLocaleForCountry(countryUpper: string, storeLocale: string): string {
  const c = countryUpper.trim().toUpperCase();
  if (c === "LV") return "lv";
  if (c === "EE") return "et";
  if (c === "LT") return "lt";
  if (storeLocale === "lv" || storeLocale === "en") return storeLocale;
  return "en";
}
