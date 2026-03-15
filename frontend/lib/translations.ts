/**
 * Client-safe translation helpers (no Node/Prisma).
 * Use from translation-context and any client component that needs t().
 */
export type Translations = Record<string, string>;

export function createT(translations: Translations): (key: string) => string {
  return (key: string) => translations[key] ?? key;
}
