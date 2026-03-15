"use client";

import { useState } from "react";

type Props = {
  subtotal: number;
  currency: string;
  onDiscountApplied?: (discount: {
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null) => void;
};

export function DiscountCodeInput({ subtotal, currency, onDiscountApplied }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cart/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid discount code");
        return;
      }

      setAppliedDiscount(data);
      onDiscountApplied?.(data);
      setCode("");
    } catch {
      setError("Failed to apply discount code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    onDiscountApplied?.(null);
    setError("");
  };

  if (appliedDiscount) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-gray-600">Discount applied</p>
            <p className="text-sm font-semibold text-black">{appliedDiscount.code}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-red-600">
              -{currency} {appliedDiscount.discountAmount.toFixed(2)}
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-gray-500 hover:text-black underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Add promo code"
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="shrink-0 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "..." : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
