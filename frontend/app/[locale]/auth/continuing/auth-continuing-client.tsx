"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/locale";

const REDIRECT_MS = 1000;

type Props = {
  locale: Locale;
  message: string;
};

/**
 * Delay then full navigation to locale home. Locale comes from the server page so it never
 * depends on useParams() hydration (which was leaving locale empty and breaking redirects).
 */
export function AuthContinuingClient({ locale, message }: Props) {
  useEffect(() => {
    const target = new URL(`/${locale}`, window.location.origin).href;
    const id = window.setTimeout(() => {
      window.location.assign(target);
    }, REDIRECT_MS);
    return () => window.clearTimeout(id);
  }, [locale]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white/90 px-6 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--mobile-cta)] border-t-transparent"
        aria-hidden
      />
      <p className="max-w-sm text-center text-sm font-semibold text-gray-900">{message}</p>
    </div>
  );
}
