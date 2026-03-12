"use client";

import { useState, useEffect } from "react";

type PopupSettings = {
  popupEnabled: boolean;
  popupDelaySeconds: number;
  popupTitle: string;
  popupDescription: string;
  popupDiscountCode: string | null;
  popupDiscountPercent: number;
};

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
        setMessage(settings?.popupDiscountCode 
          ? `Thanks for subscribing! Use code "${settings.popupDiscountCode}" for ${settings.popupDiscountPercent}% off!`
          : "Thanks for subscribing!");
        localStorage.setItem("newsletter-subscribed", "true");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300 rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-stone-900">You're In!</h3>
            <p className="text-sm text-stone-600">{message}</p>
            {settings.popupDiscountCode && (
              <div className="mt-4 rounded-xl bg-teal-50 px-4 py-3">
                <p className="text-xs text-teal-700">Your discount code:</p>
                <p className="mt-1 font-mono text-lg font-bold text-teal-800">{settings.popupDiscountCode}</p>
              </div>
            )}
            <button
              onClick={handleClose}
              className="mt-6 rounded-2xl bg-teal-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
              <svg className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="mb-2 text-xl font-semibold text-stone-900">{settings.popupTitle}</h3>
            <p className="mb-1 text-sm text-stone-600">{settings.popupDescription}</p>
            {settings.popupDiscountCode && (
              <p className="mb-4 text-sm font-medium text-teal-700">
                Get {settings.popupDiscountPercent}% off your first order!
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={status === "loading"}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm transition outline-none placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-stone-100"
              />
              {status === "error" && (
                <p className="text-sm text-red-600">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex w-full items-center justify-center rounded-2xl bg-teal-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-700 disabled:bg-teal-400"
              >
                {status === "loading" ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Subscribing...
                  </>
                ) : (
                  "Subscribe & Get Discount"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-stone-500">
              No spam, ever. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
