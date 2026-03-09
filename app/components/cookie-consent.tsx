"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "yerbatea_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
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
          We use cookies to run the store and improve your experience. By
          clicking &quot;Accept&quot;, you confirm that you have read and agree to our{" "}
          <Link
            href="/terms"
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            Terms and conditions
          </Link>{" "}
          and our{" "}
          <Link
            href="/privacy"
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            Privacy policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
