"use client";

import { useState, useRef } from "react";
import { CheckoutCustomerType } from "./checkout-customer-type";
import { CheckoutShippingBlock } from "./checkout-shipping-block";

type Props = {
  currency: string;
  subtotal: number;
};

export function CheckoutForm({ currency, subtotal }: Props) {
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isBusiness = customerType === "BUSINESS";

  const handleStripeSubmit = () => {
    if (!formRef.current) return;
    formRef.current.action = "/api/stripe/checkout";
    setIsSubmitting(true);
    formRef.current.submit();
  };

  const handleWireTransferSubmit = () => {
    if (!formRef.current) return;
    formRef.current.action = "/api/checkout/wire-transfer";
    setIsSubmitting(true);
    formRef.current.submit();
  };

  return (
    <form
      ref={formRef}
      method="post"
      className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Contact</h2>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-600">
            Full name
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <CheckoutCustomerType onCustomerTypeChange={setCustomerType} />

      <CheckoutShippingBlock currency={currency} subtotal={subtotal} />

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleStripeSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : "Pay securely with Stripe"}
        </button>

        {isBusiness && (
          <button
            type="button"
            onClick={handleWireTransferSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full border-2 border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Pay with Wire Transfer"}
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        {isBusiness
          ? "Choose Stripe for instant payment, or Wire Transfer to receive an invoice and pay later."
          : "You will be redirected to a secure Stripe Checkout page to complete your payment."}
      </p>
    </form>
  );
}
