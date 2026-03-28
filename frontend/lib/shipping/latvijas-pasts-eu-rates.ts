/**
 * EU postal parcel rates aligned with Latvijas Pasts international parcel tables:
 * separate price for **up to 500 g** and for **501 g – 1000 g**, then per additional kg.
 * Source: Latvijas Pasts tariff documentation (verify each edition).
 *
 * Offered only to EU destinations where Baltic DPD is not used (excludes LV, EE, LT).
 */

export const LP_REGISTERED_PREFIX = "LP_REGISTERED:";

/** EU member states that use DPD parcel machines instead of this postal option. */
export const BALTIC_DPD_COUNTRY_CODES = new Set(["LV", "EE", "LT"]);

export type EuRegisteredParcelRate = {
  /** 501 g – 1000 g (second step of the first kilogram). */
  baseUnder1kg: number;
  /** Surcharge for each full kg above the first. */
  additionalPerKg: number;
  /**
   * Up to 500 g inclusive. When omitted, the 501 g–1000 g price is used for all of the first kg
   * (legacy / single-step behaviour).
   */
  upTo500g?: number;
};

/** DE anchor from tariff check: 500 g vs 501 g–1000 g ratio applied to other EEA rows. */
const REF_UP_TO_500_G = 10.72;
const REF_501G_TO_1000G = 17.89;
const UP_TO_500_RATIO = REF_UP_TO_500_G / REF_501G_TO_1000G;

/** Derive the līdz 500 g step from the 501 g–1000 g price (same proportion as DE in the tariff book). */
export function defaultUpTo500gFrom501gTo1000g(base501to1000: number): number {
  return Math.round(base501to1000 * UP_TO_500_RATIO * 100) / 100;
}

function rate501AndPerKg(baseUnder1kg: number, additionalPerKg: number): EuRegisteredParcelRate {
  return {
    baseUnder1kg,
    additionalPerKg,
    upTo500g: defaultUpTo500gFrom501gTo1000g(baseUnder1kg),
  };
}

/**
 * Registered / Standard+ style EEA parcel rates (501 g–1000 g column + per kg).
 * `upTo500g` is derived with the same proportion as the DE reference unless overridden in admin JSON.
 */
export const DEFAULT_EU_REGISTERED_PARCEL_RATES: Record<string, EuRegisteredParcelRate> = {
  AT: rate501AndPerKg(13.45, 1.67),
  BE: rate501AndPerKg(18.42, 1.85),
  BG: rate501AndPerKg(11.79, 2.08),
  HR: rate501AndPerKg(13.15, 1.6),
  CY: rate501AndPerKg(14.55, 3.52),
  CZ: rate501AndPerKg(12.63, 1.67),
  DK: rate501AndPerKg(19.18, 1.86),
  FI: rate501AndPerKg(14.81, 1.95),
  FR: rate501AndPerKg(14.45, 2.68),
  DE: rate501AndPerKg(17.89, 2.37),
  GR: rate501AndPerKg(13.89, 2.31),
  HU: rate501AndPerKg(14.95, 1.93),
  IE: rate501AndPerKg(15.03, 2.26),
  IT: rate501AndPerKg(15.23, 1.89),
  LU: rate501AndPerKg(14.77, 1.95),
  MT: rate501AndPerKg(17.77, 3.42),
  NL: rate501AndPerKg(14.74, 1.71),
  PL: rate501AndPerKg(12.82, 2.47),
  PT: rate501AndPerKg(17.4, 2.05),
  RO: rate501AndPerKg(18.17, 3.04),
  SK: rate501AndPerKg(11.57, 1.88),
  SI: rate501AndPerKg(11.14, 1.89),
  ES: rate501AndPerKg(15.95, 2.1),
  SE: rate501AndPerKg(14.36, 1.84),
};

export function isLatvijasPastsRegisteredShippingId(id: string): boolean {
  return id.startsWith(LP_REGISTERED_PREFIX);
}

export function parseLatvijasPastsRegisteredCountry(id: string): string | null {
  if (!isLatvijasPastsRegisteredShippingId(id)) return null;
  const cc = id.slice(LP_REGISTERED_PREFIX.length).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(cc) ? cc : null;
}

export function isEuLatvijasPastsPostalDestination(countryCode: string): boolean {
  const c = countryCode.toUpperCase();
  if (BALTIC_DPD_COUNTRY_CODES.has(c)) return false;
  return Object.prototype.hasOwnProperty.call(DEFAULT_EU_REGISTERED_PARCEL_RATES, c);
}

/**
 * Chargeable total mass in kg (sum of line weights). LP splits the first kg at 500 g.
 */
export function computeRegisteredParcelEur(
  pair: EuRegisteredParcelRate,
  totalKg: number,
): number {
  const w = Math.max(0, totalKg);
  const upTo500 = pair.upTo500g ?? pair.baseUnder1kg;

  if (w <= 0.5) return upTo500;
  if (w <= 1) return pair.baseUnder1kg;
  return pair.baseUnder1kg + (w - 1) * pair.additionalPerKg;
}

export function roundShippingEur(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Deep-merge validated overrides onto defaults (ISO2 keys).
 */
export function mergeEuRegisteredParcelRates(override: unknown): Record<string, EuRegisteredParcelRate> {
  const out: Record<string, EuRegisteredParcelRate> = {
    ...DEFAULT_EU_REGISTERED_PARCEL_RATES,
  };
  if (!override || typeof override !== "object" || Array.isArray(override)) return out;

  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    const code = k.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) continue;
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const rec = v as Record<string, unknown>;
    const base = Number(rec.baseUnder1kg ?? rec.base ?? rec.firstKg);
    const add = Number(rec.additionalPerKg ?? rec.perKg);
    const u500 = rec.upTo500g != null ? Number(rec.upTo500g) : undefined;
    if (!Number.isFinite(base) || !Number.isFinite(add) || base < 0 || add < 0) continue;
    const next: EuRegisteredParcelRate = {
      baseUnder1kg: base,
      additionalPerKg: add,
      upTo500g:
        u500 !== undefined && Number.isFinite(u500) && u500 >= 0
          ? u500
          : defaultUpTo500gFrom501gTo1000g(base),
    };
    out[code] = next;
  }
  return out;
}

/** Parse non-empty JSON body; throws on invalid JSON. Merges with defaults for missing keys. */
export function parseEuRegisteredParcelRatesJsonOrThrow(json: string): Record<string, EuRegisteredParcelRate> {
  const parsed = JSON.parse(json) as unknown;
  return mergeEuRegisteredParcelRates(parsed);
}
