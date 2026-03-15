"use client";

import { useState, useRef } from "react";
import { CheckoutCustomerType } from "./checkout-customer-type";
import { CheckoutShippingBlock } from "./checkout-shipping-block";

type Props = {
  currency: string;
  subtotal: number;
  discountCode?: string | null;
  maksekeskusAvailable?: boolean;
};

export function CheckoutForm({ currency, subtotal, discountCode, maksekeskusAvailable }: Props) {
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState<string>("standard-flat");
  const formRef = useRef<HTMLFormElement>(null);

  const isBusiness = customerType === "BUSINESS";
  const isDpdParcelMachine = shippingMethod === "dpd-parcel-machine";

  const getInputValue = (name: string): string => {
    const form = formRef.current;
    if (!form) return "";
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    return input?.value?.trim() ?? "";
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!getInputValue("email")) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getInputValue("email"))) {
      newErrors.email = "Please enter a valid email";
    }

    if (!getInputValue("name")) {
      newErrors.name = "Full name is required";
    }

    if (!getInputValue("phone")) {
      newErrors.phone = "Phone number is required for delivery";
    }

    if (!isDpdParcelMachine) {
      if (!getInputValue("addressLine1")) {
        newErrors.addressLine1 = "Address is required";
      }
      if (!getInputValue("city")) {
        newErrors.city = "City is required";
      }
      if (!getInputValue("postalCode")) {
        newErrors.postalCode = "Postal code is required";
      }
    }

    if (isBusiness) {
      if (!getInputValue("companyName")) {
        newErrors.companyName = "Company name is required";
      }
      if (!getInputValue("companyAddress")) {
        newErrors.companyAddress = "Company address is required";
      }
      if (!getInputValue("vatNumber")) {
        newErrors.vatNumber = "VAT number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStripeSubmit = () => {
    if (!formRef.current) return;
    if (!validateForm()) return;

    formRef.current.action = "/api/stripe/checkout";
    setIsSubmitting(true);
    formRef.current.submit();
  };

  const handleWireTransferSubmit = () => {
    if (!formRef.current) return;
    if (!validateForm()) return;

    formRef.current.action = "/api/checkout/wire-transfer";
    setIsSubmitting(true);
    formRef.current.submit();
  };

  const handleMaksekeskusSubmit = () => {
    if (!formRef.current) return;
    if (!validateForm()) return;

    formRef.current.action = "/api/checkout/maksekeskus";
    setIsSubmitting(true);
    formRef.current.submit();
  };

  const inputClassName = (fieldName: string) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm ${
      errors[fieldName]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
    }`;

  return (
    <form
      ref={formRef}
      method="post"
      className="space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      {discountCode && (
        <input type="hidden" name="discountCode" value={discountCode} />
      )}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Please fill in all required fields highlighted below.
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-black">Contact</h2>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className={inputClassName("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Full name
          </label>
          <input
            type="text"
            name="name"
            required
            className={inputClassName("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Phone number
          </label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="+371 12345678"
            className={inputClassName("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>
      </section>

      <CheckoutCustomerType
        onCustomerTypeChange={setCustomerType}
        errors={errors}
      />

      <CheckoutShippingBlock
        currency={currency}
        subtotal={subtotal}
        errors={errors}
        onShippingMethodChange={setShippingMethod}
      />

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleStripeSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing…" : "Pay securely with Stripe"}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>

        {maksekeskusAvailable && (
          <button
            type="button"
            onClick={handleMaksekeskusSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing…" : "Pay with bank link or card (Maksekeskus)"}
          </button>
        )}

        {isBusiness && (
          <button
            type="button"
            onClick={handleWireTransferSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing…" : "Pay with Wire Transfer"}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {isBusiness
          ? "Choose Stripe for instant payment, Wire Transfer for invoice, or Maksekeskus for bank link or card."
          : maksekeskusAvailable
            ? "Pay with Stripe (card) or Maksekeskus (bank link, card). You may be redirected to complete payment."
            : "You will be redirected to a secure Stripe Checkout page to complete your payment."}
      </p>
    </form>
  );
}
