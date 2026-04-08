"use client";

import { useState, useEffect } from "react";
import { useOptionalTranslation } from "@/lib/translation-context";

type PopupSettings = {
  popupEnabled: boolean;
  popupDelaySeconds: number;
  popupTitle: string;
  popupDescription: string;
  popupDiscountCode: string | null;
  popupDiscountPercent: number;
};

export function NewsletterPopup() {
  const { t } = useOptionalTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [receivedDiscountCode, setReceivedDiscountCode] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("newsletter-popup-dismissed");
    const subscribed = localStorage.getItem("newsletter-subscribed");
    if (dismissed || subscribed) return;

    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.popupEnabled) {
          setSettings(data);
          const delay = (data.popupDelaySeconds || 10) * 1000;
          const timer = setTimeout(() => setIsOpen(true), delay);
          return () => clearTimeout(timer);
        }
      })
      .catch(console.error);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("newsletter-popup-dismissed", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setReceivedDiscountCode(data.discountCode ?? null);
        setMessage("");
        localStorage.setItem("newsletter-subscribed", "true");
      } else {
        setStatus("error");
        setMessage(t("newsletter.error"));
      }
    } catch {
      setStatus("error");
      setMessage(t("newsletter.error"));
    }
  };

  if (!isOpen || !settings) return null;
  const discountPercent = settings.popupDiscountPercent ?? 10;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-popup-title"
    >
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" aria-hidden />
      <div className="relative flex min-h-full items-center justify-center px-4 py-6 sm:px-6">
        <div className="relative w-full max-w-md rounded-3xl border border-black/5 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-6">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)] focus:ring-offset-2"
            aria-label={t("common.close")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {status === "success" ? (
            <div className="space-y-4 pt-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mobile-cta)]/10">
                <svg
                  className="h-7 w-7 text-[var(--mobile-cta)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("newsletter.success")}
                </p>
                <h2 id="newsletter-popup-title" className="mt-1 text-lg font-bold tracking-tight text-black">
                  {t("newsletter.popupSuccessTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{t("newsletter.popupSuccessText")}</p>
              </div>
              {receivedDiscountCode ? (
                <div className="rounded-2xl border border-black/5 bg-white/60 px-4 py-4 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("newsletter.popupSuccessCodeLabel")}
                  </p>
                  <p className="text-xl font-bold tracking-wider text-black sm:text-2xl">{receivedDiscountCode}</p>
                  <p className="mt-2 text-xs text-gray-600">{t("newsletter.popupSuccessValidNote")}</p>
                </div>
              ) : null}
              <p className="text-center text-xs text-gray-500">{t("newsletter.popupSentInfo")}</p>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--mobile-cta)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--mobile-cta-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)] focus:ring-offset-2"
              >
                {t("newsletter.popupStartShopping")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="min-w-0 pr-10">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("newsletter.subscribeToNewsletter")}
                </p>
                <h2 id="newsletter-popup-title" className="mt-1 text-lg font-bold tracking-tight text-black">
                  {t("newsletter.popupTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{t("newsletter.popupDescription")}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--mobile-cta)]">
                  {t("newsletter.popupDiscountLine", { percent: discountPercent })}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter.placeholderDark")}
                  required
                  disabled={status === "loading"}
                  className="inline-flex h-12 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black/20 disabled:bg-gray-50 disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--mobile-cta)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--mobile-cta-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t("newsletter.popupCreatingCode")}
                    </>
                  ) : (
                    t("newsletter.popupButton", { percent: discountPercent })
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--mobile-cta)] focus:ring-offset-2"
                >
                  {t("common.close")}
                </button>
              </form>

              {status === "error" ? <p className="text-sm text-red-600">{message}</p> : null}

              <p className="text-center text-xs text-gray-500">{t("newsletter.popupNoSpam")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
