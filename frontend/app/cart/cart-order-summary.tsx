"use client";

import { useState } from "react";
import { DiscountCodeInput } from "./discount-code-input";
import { CartShippingPreview } from "./cart-shipping-preview";
import { CartReminder } from "@/app/components/cart-reminder";

type Props = {
  subtotal: number;
  currency: string;
  showReminder: boolean;
  bundleSavings?: number;
};

export function CartOrderSummary({ subtotal, currency, showReminder, bundleSavings = 0 }: Props) {
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);

  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const discountedSubtotal = subtotal - discountAmount - bundleSavings;

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[#283618]">Order summary</h2>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-stone-500">Subtotal</dt>
          <dd className="font-medium text-stone-900">
            {currency} {subtotal.toFixed(2)}
          </dd>
        </div>
        {bundleSavings > 0 && (
          <div className="flex justify-between text-teal-700">
            <dt>Bundle savings</dt>
            <dd className="font-medium">
              -{currency} {bundleSavings.toFixed(2)}
            </dd>
          </div>
        )}
        {appliedDiscount && (
          <div className="flex justify-between text-teal-700">
            <dt>Discount ({appliedDiscount.code})</dt>
            <dd className="font-medium">
              -{currency} {discountAmount.toFixed(2)}
            </dd>
          </div>
        )}
        <div className="border-t border-stone-100 pt-3">
          <CartShippingPreview subtotal={discountedSubtotal} currency={currency} />
        </div>
      </dl>

      <div className="border-t border-stone-100 pt-3">
        <DiscountCodeInput
          subtotal={subtotal}
          currency={currency}
          onDiscountApplied={setAppliedDiscount}
        />
      </div>

      <form action="/checkout" method="get" className="pt-2">
        {appliedDiscount && (
          <input type="hidden" name="discountCode" value={appliedDiscount.code} />
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-full bg-[#344e41] px-4 py-2 text-sm font-medium text-[#dad7cd] transition hover:bg-[#24352b]"
        >
          Checkout
        </button>
      </form>

      <p className="text-xs text-stone-500">
        You can checkout as a guest or create an account during checkout.
      </p>
      {showReminder && (
        <div className="border-t border-stone-100 pt-3">
          <p className="mb-2 text-xs font-medium text-stone-700">Get a reminder</p>
          <CartReminder />
        </div>
      )}
    </div>
  );
}
