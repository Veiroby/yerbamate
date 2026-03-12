"use client";

import { useState, useRef } from "react";
import { CheckoutCustomerType } from "./checkout-customer-type";
import { CheckoutShippingBlock } from "./checkout-shipping-block";

type Props = {
  currency: string;
  subtotal: number;
  discountCode?: string | null;
};

export function CheckoutForm({ currency, subtotal, discountCode }: Props) {
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

  const inputClassName = (fieldName: string) =>
    `w-full rounded-xl border px-3 py-2 text-sm ${
      errors[fieldName]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
        : "border-zinc-300 focus:border-emerald-500 focus:ring-emerald-500"
    }`;

  return (
    <form
      ref={formRef}
      method="post"
      className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      {discountCode && (
        <input type="hidden" name="discountCode" value={discountCode} />
      )}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          Please fill in all required fields highlighted below.
        </div>
      )}

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
            className={inputClassName("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-600">
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
          <label className="block text-xs font-medium text-zinc-600">
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
