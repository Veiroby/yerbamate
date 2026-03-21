"use client";

import { useState, useRef } from "react";
import { CheckoutCustomerType } from "./checkout-customer-type";
import { CheckoutShippingBlock } from "./checkout-shipping-block";
import { LOCAL_PICKUP_METHOD_ID } from "@/lib/shipping/local-pickup";

type Props = {
  currency: string;
  subtotal: number;
  discountCode?: string | null;
  maksekeskusAvailable?: boolean;
  /** When set (e.g. "lv" | "en"), success/cancel redirects use /[locale]/checkout/... */
  locale?: string;
};

export function CheckoutForm({ currency, subtotal, discountCode, maksekeskusAvailable, locale }: Props) {
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState<string>("standard-flat");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isBusiness = customerType === "BUSINESS";
  const isDpdParcelMachine = shippingMethod === "dpd-parcel-machine";
  const isLocalPickup = shippingMethod === LOCAL_PICKUP_METHOD_ID;
  const prefix = locale ? `/${locale}` : "";
  const isLv = locale === "lv";

  const getInputValue = (name: string): string => {
    const form = formRef.current;
    if (!form) return "";
    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      `input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`,
    );
    for (const field of fields) {
      const value = field.value?.trim();
      if (value) return value;
    }
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!getInputValue("email")) {
      newErrors.email = isLv ? "E-pasts ir obligāts" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getInputValue("email"))) {
      newErrors.email = isLv ? "Lūdzu, ievadiet derīgu e-pasta adresi" : "Please enter a valid email";
    }

    if (!getInputValue("name")) {
      newErrors.name = isLv ? "Pilns vārds ir obligāts" : "Full name is required";
    }

    if (!getInputValue("phone")) {
      newErrors.phone = isLv ? "Piegādei nepieciešams tālruņa numurs" : "Phone number is required for delivery";
    }

    if (!isDpdParcelMachine && !isLocalPickup) {
      if (!getInputValue("addressLine1")) {
        newErrors.addressLine1 = isLv ? "Adrese ir obligāta" : "Address is required";
      }
      if (!getInputValue("city")) {
        newErrors.city = isLv ? "Pilsēta ir obligāta" : "City is required";
      }
      if (!getInputValue("postalCode")) {
        newErrors.postalCode = isLv ? "Pasta indekss ir obligāts" : "Postal code is required";
      }
    }

    if (isBusiness) {
      if (!getInputValue("companyName")) {
        newErrors.companyName = isLv ? "Uzņēmuma nosaukums ir obligāts" : "Company name is required";
      }
      if (!getInputValue("companyAddress")) {
        newErrors.companyAddress = isLv ? "Uzņēmuma adrese ir obligāta" : "Company address is required";
      }
      if (!getInputValue("vatNumber")) {
        newErrors.vatNumber = isLv ? "PVN numurs ir obligāts" : "VAT number is required";
      }
    }

    if (!termsAccepted) {
      newErrors.terms = isLv
        ? "Lūdzu, apstipriniet, ka piekrītat lietošanas noteikumiem un privātuma politikai."
        : "Please confirm you accept the Terms and Conditions and Privacy Policy.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * POST checkout via fetch so CSP `form-action` does not block same-origin
   * submissions (HTML form submit is subject to form-action; fetch uses connect-src).
   */
  const submitCheckoutViaFetch = async (actionPath: string) => {
    if (!formRef.current) return;
    if (!validateForm()) return;

    setErrors((prev) => {
      const { _submit: _s, ...rest } = prev;
      return rest;
    });
    setIsSubmitting(true);
    try {
      const formData = new FormData(formRef.current);
      const res = await fetch(actionPath, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        redirect: "manual",
      });

      if (res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) {
        const loc = res.headers.get("Location");
        if (loc) {
          window.location.href = loc;
          return;
        }
      }

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.error) {
          setErrors((prev) => ({ ...prev, _submit: data.error }));
        }
        return;
      }

      const data = await res.json().catch(() => ({}));
      setErrors((prev) => ({
        ...prev,
        _submit:
          typeof data.error === "string"
            ? data.error
            : isLv
              ? "Neizdevās apstrādāt pasūtījumu. Lūdzu, mēģiniet vēlreiz."
              : "Could not process checkout. Please try again.",
      }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        _submit: isLv ? "Tīkla kļūda. Lūdzu, mēģiniet vēlreiz." : "Network error. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSubmit = () => {
    void submitCheckoutViaFetch("/api/stripe/checkout");
  };

  const handleWireTransferSubmit = () => {
    void submitCheckoutViaFetch("/api/checkout/wire-transfer");
  };

  const handleMaksekeskusSubmit = () => {
    void submitCheckoutViaFetch("/api/checkout/maksekeskus");
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
      {locale && (
        <input type="hidden" name="locale" value={locale} />
      )}
      {errors._submit && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors._submit}
        </div>
      )}
      {Object.keys(errors).filter((k) => k !== "_submit").length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {isLv
            ? "Lūdzu, aizpildiet visus obligātos laukus, kas izcelti zemāk."
            : "Please fill in all required fields highlighted below."}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-black">
          {isLv ? "Kontaktinformācija" : "Contact"}
        </h2>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            {isLv ? "E-pasts" : "Email"}
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
            {isLv ? "Pilns vārds" : "Full name"}
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
            {isLv ? "Tālruņa numurs" : "Phone number"}
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
        locale={locale === "lv" || locale === "en" ? locale : undefined}
      />

      <CheckoutShippingBlock
        currency={currency}
        subtotal={subtotal}
        errors={errors}
        locale={locale === "lv" || locale === "en" ? locale : undefined}
        onShippingMethodChange={setShippingMethod}
      />

      <div className="space-y-3 pt-2">
        <div className="flex items-start gap-2">
          <input
            id="checkout-accept-terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          />
          <label
            htmlFor="checkout-accept-terms"
            className="text-xs text-gray-600"
          >
            {isLv ? (
              <>
                Es piekrītu{" "}
                <a
                  href={`${prefix}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  lietošanas noteikumiem
                </a>{" "}
                un{" "}
                <a
                  href={`${prefix}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  privātuma politikai
                </a>
                .
              </>
            ) : (
              <>
                I agree to the{" "}
                <a
                  href={`${prefix}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href={`${prefix}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Privacy Policy
                </a>
                .
              </>
            )}
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-red-600 mt-1">{errors.terms}</p>
        )}

        <button
          type="button"
          onClick={handleStripeSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isLv
              ? "Apstrādā maksājumu…"
              : "Processing…"
            : isLv
              ? "Drošs maksājums ar Stripe"
              : "Pay securely with Stripe"}
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
            {isSubmitting
              ? isLv
                ? "Apstrādā maksājumu…"
                : "Processing…"
              : isLv
                ? "Maksāt ar internetbanku vai karti (Maksekeskus)"
                : "Pay with bank link or card (Maksekeskus)"}
          </button>
        )}

        {isBusiness && (
          <button
            type="button"
            onClick={handleWireTransferSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? isLv
                ? "Apstrādā maksājumu…"
                : "Processing…"
              : isLv
                ? "Maksāt ar bankas pārskaitījumu"
                : "Pay with Wire Transfer"}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {isBusiness
          ? isLv
            ? "Izvēlieties Stripe tūlītējam maksājumam, bankas pārskaitījumu rēķinam vai Maksekeskus internetbankas saitei vai kartei."
            : "Choose Stripe for instant payment, Wire Transfer for invoice, or Maksekeskus for bank link or card."
          : maksekeskusAvailable
            ? isLv
              ? "Maksājiet ar Stripe (karte) vai Maksekeskus (internetbanka, karte). Jūs var tikt novirzīts uz maksājumu lapu."
              : "Pay with Stripe (card) or Maksekeskus (bank link, card). You may be redirected to complete payment."
            : isLv
              ? "Jūs tiksiet novirzīts uz drošu Stripe norēķinu lapu, lai pabeigtu maksājumu."
              : "You will be redirected to a secure Stripe Checkout page to complete your payment."}
      </p>
    </form>
  );
}
