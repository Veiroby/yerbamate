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
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {isLv ? "Sīkdatnes" : "Cookies"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-700">
                {isLv
                  ? "Mēs izmantojam nepieciešamās sīkdatnes veikala darbībai un papildu sīkdatnes pieredzes un analītikas uzlabošanai."
                  : "We use necessary cookies to run the store, and optional cookies to improve your experience and analytics."}{" "}
                <span className="text-stone-600">
                  {isLv ? "Turpinot lietot vietni, jūs piekrītat " : "By continuing, you agree to our "}
                </span>
                <Link
                  href={termsHref}
                  className="font-semibold text-[#283618] underline underline-offset-2 hover:text-black"
                >
                  {isLv ? "Lietošanas noteikumiem" : "Terms and conditions"}
                </Link>
                <span className="text-stone-600"> {isLv ? "un" : "and"} </span>
                <Link
                  href={privacyHref}
                  className="font-semibold text-[#283618] underline underline-offset-2 hover:text-black"
                >
                  {isLv ? "Privātuma politikai" : "Privacy policy"}
                </Link>
                .
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={reject}
                className="inline-flex h-11 items-center justify-center rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#283618] focus:ring-offset-2"
              >
                {isLv ? "Tikai nepieciešamās" : "Only essential"}
              </button>
              <button
                type="button"
                onClick={accept}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#283618] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f2a12] focus:outline-none focus:ring-2 focus:ring-[#283618] focus:ring-offset-2"
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
