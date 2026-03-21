"use client";

import { toast as sonnerToast } from "sonner";

type Props = {
  toastId: string | number;
  title: string;
  productName: string;
  viewCartLabel: string;
  cartHref: string;
};

export function AddedToCartToast({ toastId, title, productName, viewCartLabel, cartHref }: Props) {
  return (
    <div className="pointer-events-auto w-[min(calc(100vw-1.5rem),22rem)] rounded-2xl border border-gray-200 bg-white p-5 shadow-lg ring-1 ring-black/5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white"
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xl font-bold leading-tight tracking-tight text-black">{title}</p>
          <p className="mt-2 text-lg font-medium leading-snug text-gray-900">{productName}</p>
        </div>
      </div>
      <button
        type="button"
        className="mt-5 w-full rounded-full bg-black px-4 py-3.5 text-base font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        onClick={() => {
          sonnerToast.dismiss(toastId);
          window.location.href = cartHref;
        }}
      >
        {viewCartLabel}
      </button>
    </div>
  );
}
