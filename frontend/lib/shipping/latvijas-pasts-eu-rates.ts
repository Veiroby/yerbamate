/**
 * EU postal parcel rates aligned with Latvijas Pasts international "Standard+ (Registered)"
 * parcel table: price for shipment up to 1000 g, plus surcharge per additional kg.
 * Source: Latvijas Pasts tariff documentation (verify against current edition before go-live).
 *
 * Offered only to EU destinations where Baltic DPD is not used (excludes LV, EE, LT).
 */

export const LP_REGISTERED_PREFIX = "LP_REGISTERED:";

/** EU member states that use DPD parcel machines instead of this postal option. */
export const BALTIC_DPD_COUNTRY_CODES = new Set(["LV", "EE", "LT"]);

export type EuRegisteredParcelRate = {
  baseUnder1kg: number;
  additionalPerKg: number;
};

/**
 * Registered parcel, EEA destinations (Latvijas Pasts tariff extract).
 * Keys: ISO 3166-1 alpha-2.
 */
export const DEFAULT_EU_REGISTERED_PARCEL_RATES: Record<string, EuRegisteredParcelRate> = {
  AT: { baseUnder1kg: 13.45, additionalPerKg: 1.67 },
  BE: { baseUnder1kg: 18.42, additionalPerKg: 1.85 },
  BG: { baseUnder1kg: 11.79, additionalPerKg: 2.08 },
  HR: { baseUnder1kg: 13.15, additionalPerKg: 1.6 },
  CY: { baseUnder1kg: 14.55, additionalPerKg: 3.52 },
  CZ: { baseUnder1kg: 12.63, additionalPerKg: 1.67 },
  DK: { baseUnder1kg: 19.18, additionalPerKg: 1.86 },
  FI: { baseUnder1kg: 14.81, additionalPerKg: 1.95 },
  FR: { baseUnder1kg: 14.45, additionalPerKg: 2.68 },
  DE: { baseUnder1kg: 17.89, additionalPerKg: 2.37 },
  GR: { baseUnder1kg: 13.89, additionalPerKg: 2.31 },
  HU: { baseUnder1kg: 14.95, additionalPerKg: 1.93 },
  IE: { baseUnder1kg: 15.03, additionalPerKg: 2.26 },
  IT: { baseUnder1kg: 15.23, additionalPerKg: 1.89 },
  LU: { baseUnder1kg: 14.77, additionalPerKg: 1.95 },
  MT: { baseUnder1kg: 17.77, additionalPerKg: 3.42 },
  NL: { baseUnder1kg: 14.74, additionalPerKg: 1.71 },
  PL: { baseUnder1kg: 12.82, additionalPerKg: 2.47 },
  PT: { baseUnder1kg: 17.4, additionalPerKg: 2.05 },
  RO: { baseUnder1kg: 18.17, additionalPerKg: 3.04 },
  SK: { baseUnder1kg: 11.57, additionalPerKg: 1.88 },
  SI: { baseUnder1kg: 11.14, additionalPerKg: 1.89 },
  ES: { baseUnder1kg: 15.95, additionalPerKg: 2.1 },
  SE: { baseUnder1kg: 14.36, additionalPerKg: 1.84 },
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

export function computeRegisteredParcelEur(
  pair: EuRegisteredParcelRate,
  totalKg: number,
): number {
  const w = Math.max(0, totalKg);
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
    if (Number.isFinite(base) && Number.isFinite(add) && base >= 0 && add >= 0) {
      out[code] = { baseUnder1kg: base, additionalPerKg: add };
    }
  }
  return out;
}

/** Parse non-empty JSON body; throws on invalid JSON. Merges with defaults for missing keys. */
export function parseEuRegisteredParcelRatesJsonOrThrow(json: string): Record<string, EuRegisteredParcelRate> {
  const parsed = JSON.parse(json) as unknown;
  return mergeEuRegisteredParcelRates(parsed);
}
