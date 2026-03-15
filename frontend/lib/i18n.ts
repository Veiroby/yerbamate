import path from "path";
import fs from "fs";
import { prisma } from "@/lib/db";
import type { Locale } from "./locale";
import type { Translations } from "./translations";

export type { Locale } from "./locale";
export { LOCALES, DEFAULT_LOCALE, isValidLocale } from "./locale";
export type { Translations } from "./translations";
export { createT } from "./translations";

/**
 * For server-side redirects: prefix path with current locale from cookie (set by middleware).
 * Use when redirecting from [locale] pages so the redirect stays in the same locale.
 */
export async function getLocalePrefixForRedirect(): Promise<string> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const locale = store.get("NEXT_LOCALE")?.value;
  return locale === "lv" || locale === "en" ? `/${locale}` : "";
}

function loadDefaultTranslations(locale: Locale): Translations {
  const localePath = path.join(process.cwd(), "locales", `${locale}.json`);
  try {
    const raw = fs.readFileSync(localePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, string>;
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

/**
 * Get merged translations for a locale: default JSON first, then DB overrides.
 * Missing keys for non-EN locale are filled from EN defaults.
 */
export async function getTranslations(locale: Locale): Promise<Translations> {
  const defaults = loadDefaultTranslations(locale);
  const enDefaults = locale !== "en" ? loadDefaultTranslations("en") : {};
  const overrides = await prisma.translation.findMany({
    where: { locale },
    select: { key: true, value: true },
  });
  const result: Translations = { ...enDefaults, ...defaults };
  for (const row of overrides) {
    result[row.key] = row.value;
  }
  return result;
}
