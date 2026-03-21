"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  message: string;
  continueLabel: string;
  homeLabel: string;
  continueHref: string;
  homeHref: string;
  closeAriaLabel: string;
};

/**
 * Full-screen confirmation dialog shown when the user lands on checkout success.
 */
export function CheckoutSuccessConfirmation({
  title,
  message,
  continueLabel,
  homeLabel,
  continueHref,
  homeHref,
  closeAriaLabel,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-success-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={closeAriaLabel}
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#606C38]/25 bg-[#FEFAE0] p-6 shadow-xl">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-1.5 text-[#283618]/60 transition hover:bg-[#606C38]/15 hover:text-[#283618]"
          aria-label={closeAriaLabel}
          onClick={() => setOpen(false)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#606C38]/15">
          <svg
            className="h-9 w-9 text-[#283618]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2
          id="checkout-success-modal-title"
          className="mt-4 text-center font-serif text-xl font-semibold text-[#283618] sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-black/85">{message}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Link
            href={continueHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[#283618] px-5 py-2.5 text-center text-sm font-medium uppercase tracking-wide text-[#FEFAE0] hover:bg-[#283618]/90"
            onClick={() => setOpen(false)}
          >
            {continueLabel}
          </Link>
          <Link
            href={homeHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[#606C38]/40 px-5 py-2.5 text-center text-sm font-medium uppercase tracking-wide text-[#283618] hover:bg-[#606C38]/10"
            onClick={() => setOpen(false)}
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
