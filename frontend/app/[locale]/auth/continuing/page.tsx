"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";
import { isValidLocale } from "@/lib/locale";

const REDIRECT_MS = 1000;

function localeFromParams(params: ReturnType<typeof useParams>): string {
  const raw = params?.locale;
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : "";
  return typeof raw === "string" ? raw : "";
}

/** After successful auth: show loading briefly, then hard-navigate to locale home (reliable vs client router alone). */
export default function AuthContinuingPage() {
  const params = useParams();
  const { t } = useTranslation();
  const locale = localeFromParams(params);

  useEffect(() => {
    if (!isValidLocale(locale)) {
      window.location.replace("/");
      return;
    }
    const home = `/${locale}`;
    const id = window.setTimeout(() => {
      window.location.replace(home);
    }, REDIRECT_MS);
    return () => window.clearTimeout(id);
  }, [locale]);

  if (!isValidLocale(locale)) {
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
      </div>
    );
  }

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
      <p className="max-w-sm text-center text-sm font-semibold text-gray-900">
        {t("account.authContinuingPhase1")}
      </p>
    </div>
  );
}
