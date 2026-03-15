/**
 * Client-safe translation helpers (no Node/Prisma).
 * Use from translation-context and any client component that needs t().
 * Supports placeholders: t('key', { count: 5 }) replaces {count} in the string.
 */
export type Translations = Record<string, string>;

export function createT(translations: Translations): (key: string, vars?: Record<string, string | number>) => string {
  return (key: string, vars?: Record<string, string | number>) => {
    let s = translations[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  };
}
