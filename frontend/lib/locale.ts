/**
 * Locale constants and validation. Edge-safe (no Node/Prisma).
 * Use from middleware. For getTranslations etc. use @/lib/i18n.
 */
export type Locale = "lv" | "en";

export const LOCALES: Locale[] = ["lv", "en"];

export const DEFAULT_LOCALE: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || "lv";

export function isValidLocale(value: string): value is Locale {
  return value === "lv" || value === "en";
}
