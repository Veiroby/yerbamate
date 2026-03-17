"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";

const CONSENT_KEY = "yerbatea_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const termsHref = localePrefix ? `${localePrefix}/terms` : "/terms";
  const privacyHref = localePrefix ? `${localePrefix}/privacy` : "/privacy";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          {t("cookies.bannerText")}{" "}
          <Link
            href={termsHref}
            className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            {t("cookies.terms")}
          </Link>{" "}
          ·{" "}
          <Link
            href={privacyHref}
            className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            {t("cookies.privacy")}
          </Link>{" "}
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={reject}
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {t("cookies.essentialOnly")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-[#344e41] px-5 py-2.5 text-sm font-medium text-[#dad7cd] transition hover:bg-[#24352b] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {t("cookies.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
