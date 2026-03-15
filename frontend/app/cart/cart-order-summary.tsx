"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";
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
  const { t } = useTranslation();
  const pathname = usePathname();
  const checkoutPrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const checkoutAction = checkoutPrefix ? `${checkoutPrefix}/checkout` : "/checkout";
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);

  const discountAmount = appliedDiscount?.discountAmount ?? 0;
  const discountedSubtotal = subtotal - discountAmount - bundleSavings;

  return (
    <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-black">{t("cart.orderSummary")}</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Subtotal</dt>
          <dd className="font-medium text-black">
            {currency} {subtotal.toFixed(2)}
          </dd>
        </div>
        {bundleSavings > 0 && (
          <div className="flex justify-between text-red-600">
            <dt>Bundle savings</dt>
            <dd className="font-medium">
              -{currency} {bundleSavings.toFixed(2)}
            </dd>
          </div>
        )}
        {appliedDiscount && (
          <div className="flex justify-between text-red-600">
            <dt>Discount ({appliedDiscount.code})</dt>
            <dd className="font-medium">
              -{currency} {discountAmount.toFixed(2)}
            </dd>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <CartShippingPreview subtotal={discountedSubtotal} currency={currency} />
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-3">
          <dt className="font-bold text-black">Total</dt>
          <dd className="font-bold text-black">
            {currency} {Math.max(0, discountedSubtotal).toFixed(2)}
          </dd>
        </div>
      </dl>

      <div>
        <DiscountCodeInput
          subtotal={subtotal}
          currency={currency}
          onDiscountApplied={setAppliedDiscount}
        />
      </div>

      <form action={checkoutAction} method="get" className="pt-1">
        {appliedDiscount && (
          <input type="hidden" name="discountCode" value={appliedDiscount.code} />
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("cart.goToCheckout")}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </form>

      <p className="text-xs text-gray-500">
        You can checkout as a guest or create an account during checkout.
      </p>
      {showReminder && (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-700">Get a reminder</p>
          <CartReminder />
        </div>
      )}
    </div>
  );
}
