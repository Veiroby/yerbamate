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
      <div className="rounded-xl bg-emerald-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-800">
              Discount applied
            </p>
            <p className="text-sm font-semibold text-emerald-700">
              {appliedDiscount.code}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-700">
              -{currency} {appliedDiscount.discountAmount.toFixed(2)}
            </p>
            <button
              onClick={handleRemove}
              className="text-xs text-emerald-600 hover:text-emerald-700 underline"
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
      <p className="text-xs font-medium text-zinc-700">Discount code</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "..." : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
