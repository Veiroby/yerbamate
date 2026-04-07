"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";
import { isValidLocale } from "@/lib/locale";

/** Intermediate screen after successful auth: two-phase loading, then locale home. */
export default function AuthContinuingPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "";
  const router = useRouter();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<1 | 2>(1);

  useEffect(() => {
    if (!isValidLocale(locale)) return;
    const t1 = window.setTimeout(() => setPhase(2), 750);
    const t2 = window.setTimeout(() => {
      router.replace(`/${locale}`);
    }, 1650);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [locale, router]);

  if (!isValidLocale(locale)) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white/90 px-6 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      {phase === 1 ? (
        <div
          className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--mobile-cta)] border-t-transparent"
          aria-hidden
        />
      ) : (
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--mobile-cta)] [animation-delay:0ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--mobile-cta)] [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--mobile-cta)] [animation-delay:300ms]" />
        </div>
      )}
      <p className="max-w-sm text-center text-sm font-semibold text-gray-900">
        {phase === 1 ? t("account.authContinuingPhase1") : t("account.authContinuingPhase2")}
      </p>
    </div>
  );
}
