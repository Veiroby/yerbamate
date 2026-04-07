"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "yerbatea_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const termsHref = localePrefix ? `${localePrefix}/terms` : "/terms";
  const privacyHref = localePrefix ? `${localePrefix}/privacy` : "/privacy";
  const isLv = localePrefix === "/lv";

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
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Cookie consent">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-6">
          <div className="space-y-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {isLv ? "Sīkdatnes" : "Cookies"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {isLv
                  ? "Mēs izmantojam nepieciešamās sīkdatnes veikala darbībai un papildu sīkdatnes pieredzes un analītikas uzlabošanai."
                  : "We use necessary cookies to run the store, and optional cookies to improve your experience and analytics."}{" "}
                <span className="text-gray-600">
                  {isLv ? "Turpinot lietot vietni, jūs piekrītat " : "By continuing, you agree to our "}
                </span>
                <Link
                  href={termsHref}
                  className="font-bold text-black underline underline-offset-2 hover:text-[var(--mobile-cta)]"
                >
                  {isLv ? "Lietošanas noteikumiem" : "Terms and conditions"}
                </Link>
                <span className="text-gray-600"> {isLv ? "un" : "and"} </span>
                <Link
                  href={privacyHref}
                  className="font-bold text-black underline underline-offset-2 hover:text-[var(--mobile-cta)]"
                >
                  {isLv ? "Privātuma politikai" : "Privacy policy"}
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={reject}
                className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)] focus:ring-offset-2"
              >
                {isLv ? "Tikai nepieciešamās" : "Only essential"}
              </button>
              <button
                type="button"
                onClick={accept}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--mobile-cta)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--mobile-cta-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)] focus:ring-offset-2"
              >
                {isLv ? "Piekrītu visam" : "Accept all"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
