/**
 * Parse free-text product weight into kg. Handles "500g", "1 kg", "1kg", bare "500" (grams), bare "1" (kg).
 */
export function parseLooseWeightKg(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");

  const kgMatch = s.match(/([\d.,]+)\s*kg\b/i);
  if (kgMatch) {
    const num = Number.parseFloat(kgMatch[1].replace(",", "."));
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  const gMatch = s.match(/([\d.,]+)\s*g\b/i);
  if (gMatch) {
    const num = Number.parseFloat(gMatch[1].replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return null;
    return num / 1000;
  }

  const bare = s.match(/^([\d.,]+)\s*$/);
  if (bare) {
    const num = Number.parseFloat(bare[1].replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return null;
    const isInt = Math.abs(num - Math.round(num)) < 1e-9;
    if (isInt) {
      const n = Math.round(num);
      if (n >= 1 && n <= 10) return num;
      if (n >= 11 && n <= 49_999) return num / 1000;
      if (n > 49_999) return num / 1000;
    }
    return num;
  }

  return null;
}
