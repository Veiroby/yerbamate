"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Locale } from "./locale";
import { createT, type Translations } from "./translations";

type TranslationContextType = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translations: Translations;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({
  locale,
  translations,
  children,
}: {
  locale: Locale;
  translations: Translations;
  children: ReactNode;
}) {
  const t = createT(translations);
  return (
    <TranslationContext.Provider value={{ locale, t, translations }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return ctx;
}

/** Same as `useTranslation`, but does not throw when the provider is missing. */
export function useOptionalTranslation() {
  const ctx = useContext(TranslationContext);
  if (ctx) return ctx;
  return {
    locale: "en" as Locale,
    t: (key: string) => key,
    translations: {},
  };
}
