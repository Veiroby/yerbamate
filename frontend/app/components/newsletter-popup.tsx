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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] sm:p-7">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="py-5 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f2ef]">
              <svg className="h-8 w-8 text-[#606C38]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-semibold tracking-wide text-gray-900">{t("newsletter.popupSuccessTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("newsletter.popupSuccessText")}</p>
            {receivedDiscountCode && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-[#f6fbf6] px-4 py-4">
                <p className="mb-1 text-xs font-medium text-[#606C38]">{t("newsletter.popupSuccessCodeLabel")}</p>
                <p className="text-2xl font-bold text-[#1f5b4f] tracking-wider">{receivedDiscountCode}</p>
                <p className="mt-2 text-xs text-[#606C38]">{t("newsletter.popupSuccessValidNote")}</p>
              </div>
            )}
            <p className="mt-4 text-xs text-gray-500">{t("newsletter.popupSentInfo")}</p>
            <button
              onClick={handleClose}
              className="mt-4 rounded-2xl bg-[#283618] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2c12]"
            >
              {t("newsletter.popupStartShopping")}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f2ef]">
              {/* Mail logo */}
              <svg className="h-7 w-7 text-[#606C38]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 6 8-6" />
              </svg>
            </div>

            <h3 className="mb-2 text-2xl font-semibold tracking-wide text-gray-900">{t("newsletter.popupTitle")}</h3>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">{t("newsletter.popupDescription")}</p>
            <p className="mb-4 text-sm font-medium text-[#606C38]">
              {t("newsletter.popupDiscountLine", { percent: discountPercent })}
            </p>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter.placeholderDark")}
                  required
                  disabled={status === "loading"}
                  className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm transition outline-none placeholder:text-gray-400 focus:border-[#606C38] focus:ring-2 focus:ring-[#606C38]/20 disabled:bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#283618] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f2c12] disabled:bg-[#4e6a5a] sm:w-auto sm:flex-shrink-0"
                >
                  {status === "loading" ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
              </div>

              {status === "error" && (
                <p className="mt-3 text-sm text-red-600">{message}</p>
              )}
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">{t("newsletter.popupNoSpam")}</p>
          </>
        )}
      </div>
    </div>
  );
}
