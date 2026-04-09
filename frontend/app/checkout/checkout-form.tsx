"use client";

import { useState, useRef, useEffect } from "react";
import { CheckoutCustomerType } from "./checkout-customer-type";
import { CheckoutShippingBlock } from "./checkout-shipping-block";
import { ShippingMethodSelector } from "./shipping-method-selector";
import { LOCAL_PICKUP_METHOD_ID } from "@/lib/shipping/local-pickup";
import { useLocale } from "@/lib/locale-context";
import type { CountryCode } from "@/lib/locale-data";
import { useTranslation } from "@/lib/translation-context";
import Image from "next/image";
import { CardIcon, VisaMastercardMarks } from "./payment-logos";
import {
  collectMethodCountryCodes,
  inferBanklinkCountryFromStrings,
  shippingCountryToIso2,
} from "@/lib/maksekeskus-baltic";

type Props = {
  currency: string;
  subtotal: number;
  /** Subtotal after bundle + code discount — used for shipping quotes. */
  subtotalForShipping?: number;
  /** Changes when cart line ids/qty change so shipping quotes refetch (weight-based). */
  cartFingerprint?: string;
  discountCode?: string | null;
  bundleSavings?: number;
  discountAmount?: number;
  initialShippingAmount?: number;
  maksekeskusAvailable?: boolean;
  /** When set (e.g. "lv" | "en"), success/cancel redirects use /[locale]/checkout/... */
  locale?: string;
};

type PaymentChoice = "stripe" | "maksekeskus" | "wire";

type MakseUiBank = {
  kind: "bank";
  label: string;
  methodUrl: string;
  /** Local asset under /public when known brand */
  logoSrc: string | null;
  /** Hosted logo from Maksekeskus when present */
  remoteLogo: string | null;
  sortKey: number;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-[var(--mobile-cta)] transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function CheckoutForm({
  currency,
  subtotal,
  subtotalForShipping,
  cartFingerprint,
  discountCode,
  bundleSavings = 0,
  discountAmount = 0,
  initialShippingAmount = 0,
  maksekeskusAvailable,
  locale,
}: Props) {
  const { t } = useTranslation();
  const { country: localeCountry } = useLocale();
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState<string>("standard-flat");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [shipCountry, setShipCountry] = useState<CountryCode>(localeCountry);
  const [shippingAmount, setShippingAmount] = useState(initialShippingAmount);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [methodOpen, setMethodOpen] = useState(true);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("stripe");
  const [makseMethodUrl, setMakseMethodUrl] = useState<string>("");
  const [makseMethods, setMakseMethods] = useState<MakseUiBank[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const isBusiness = customerType === "BUSINESS";
  const isDpdParcelMachine = shippingMethod === "dpd-parcel-machine";
  const isLocalPickup = shippingMethod === LOCAL_PICKUP_METHOD_ID;
  const prefix = locale ? `/${locale}` : "";
  const isLv = locale === "lv";
  const shippingQuoteSubtotal = subtotalForShipping ?? subtotal;

  const discountedSubtotal = Math.max(0, subtotal - bundleSavings - discountAmount);
  const orderTotal = discountedSubtotal + shippingAmount;

  useEffect(() => {
    setShippingAmount(initialShippingAmount);
  }, [initialShippingAmount]);

  useEffect(() => {
    if (!maksekeskusAvailable && paymentChoice === "maksekeskus") {
      setPaymentChoice("stripe");
    }
    if (!isBusiness && paymentChoice === "wire") {
      setPaymentChoice("stripe");
    }
  }, [maksekeskusAvailable, isBusiness, paymentChoice]);

  useEffect(() => {
    if (!maksekeskusAvailable) {
      setMakseMethods([]);
      setMakseMethodUrl("");
      return;
    }

    let cancelled = false;
    const targetCountry = shippingCountryToIso2(shipCountry);

    const bankLogoMap: Record<string, { label: string; logoSrc: string }> = {
      swedbank: { label: "Swedbank", logoSrc: "/payments/banks/swedbank.png" },
      seb: { label: "SEB", logoSrc: "/payments/banks/seb.png" },
      luminor: { label: "Luminor", logoSrc: "/payments/banks/luminor.png" },
      citadele: { label: "Citadele", logoSrc: "/payments/banks/citadele.png" },
      revolut: { label: "Revolut", logoSrc: "/payments/banks/revolut.png" },
    };

    const preferredOrder = ["swedbank", "seb", "luminor", "citadele", "revolut", "lhv", "coop"];

    const mapNameToPreferredId = (name: string): string | null => {
      const n = name.toLowerCase();
      if (n.includes("swed")) return "swedbank";
      if (n.includes("seb")) return "seb";
      if (n.includes("luminor")) return "luminor";
      if (n.includes("citadele")) return "citadele";
      if (n.includes("revolut")) return "revolut";
      if (n.includes("lhv")) return "lhv";
      if (n.includes("coop")) return "coop";
      return null;
    };

    fetch("/api/payments/maksekeskus/methods", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d?.methods) ? (d.methods as Array<any>) : [];

        const picked: MakseUiBank[] = [];
        const seenUrl = new Set<string>();

        for (const m of list) {
          if (m?.category && m.category !== "banklinks") continue;

          let codes = collectMethodCountryCodes({
            country: m?.country,
            countries: m?.countries,
          });
          if (codes.length === 0) {
            const inferred = inferBanklinkCountryFromStrings([
              typeof m?.url === "string" ? m.url : "",
              typeof m?.display_name === "string" ? m.display_name : "",
              typeof m?.name === "string" ? m.name : "",
            ]);
            if (inferred) codes = [inferred];
          }

          if (codes.length === 0) continue;
          if (!codes.includes(targetCountry)) continue;

          const rawLabel =
            typeof m?.display_name === "string" && m.display_name.trim()
              ? m.display_name.trim()
              : typeof m?.name === "string"
                ? m.name.trim()
                : "";
          const url = typeof m?.url === "string" ? m.url.trim() : "";
          if (!rawLabel || !url) continue;
          const urlKey = url.toLowerCase();
          if (seenUrl.has(urlKey)) continue;
          seenUrl.add(urlKey);

          const prefId = mapNameToPreferredId(rawLabel + " " + (typeof m?.name === "string" ? m.name : ""));
          const brand = prefId && bankLogoMap[prefId] ? bankLogoMap[prefId] : null;
          const label = brand?.label ?? rawLabel;
          let logoSrc: string | null = brand?.logoSrc ?? null;
          const remoteRaw = typeof m?.logo_url === "string" ? m.logo_url.trim() : "";
          const remoteLogo =
            remoteRaw.startsWith("https://") || remoteRaw.startsWith("http://") ? remoteRaw : null;
          if (!logoSrc && !remoteLogo) logoSrc = null;

          const sortIx = prefId ? preferredOrder.indexOf(prefId) : -1;
          const sortKey = sortIx === -1 ? 1000 : sortIx;

          picked.push({
            kind: "bank",
            label,
            methodUrl: url,
            logoSrc,
            remoteLogo,
            sortKey,
          });
        }

        picked.sort((a, b) => (a.sortKey !== b.sortKey ? a.sortKey - b.sortKey : a.label.localeCompare(b.label)));

        setMakseMethods(picked);
      })
      .catch(() => {
        if (cancelled) return;
        setMakseMethods([]);
      });

    return () => {
      cancelled = true;
    };
  }, [maksekeskusAvailable, shipCountry]);

  useEffect(() => {
    if (
      paymentChoice === "maksekeskus" &&
      makseMethodUrl &&
      !makseMethods.some((x) => x.methodUrl === makseMethodUrl)
    ) {
      setMakseMethodUrl("");
    }
  }, [paymentChoice, makseMethodUrl, makseMethods]);

  const showMakseBanks = maksekeskusAvailable && makseMethods.length > 0;

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
  }

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
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json().catch(() => ({} as { url?: string; error?: string }));

      if (res.ok && typeof data.url === "string" && data.url.length > 0) {
        window.location.href = data.url;
        return;
      }

      if (typeof data.error === "string" && data.error.length > 0) {
        setErrors((prev) => ({ ...prev, _submit: data.error }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        _submit: isLv
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

  const handlePay = () => {
    if (paymentChoice === "stripe") void submitCheckoutViaFetch("/api/stripe/checkout");
    else if (paymentChoice === "maksekeskus") void submitCheckoutViaFetch("/api/checkout/maksekeskus");
    else void submitCheckoutViaFetch("/api/checkout/wire-transfer");
  };

  const inputClassName = (fieldName: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm ${
      errors[fieldName]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20"
    }`;

  const panelBtn =
    "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left lg:hidden";
  const panelBody = (open: boolean) =>
    `${!open ? "max-lg:hidden" : ""} max-lg:border-t max-lg:border-gray-100 max-lg:px-4 max-lg:pb-4 lg:block`;

  const paymentRow = (active: boolean) =>
    `flex w-full min-w-0 max-w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${
      active ? "border-[var(--mobile-cta)] bg-[var(--mobile-cta)]/5" : "border-gray-200 hover:border-gray-300"
    }`;

  return (
    <form
      ref={formRef}
      method="post"
      className="space-y-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:rounded-2xl lg:border-0"
      onSubmit={(e) => e.preventDefault()}
    >
      {discountCode && (
        <input type="hidden" name="discountCode" value={discountCode} />
      )}
      {locale && (
        <input type="hidden" name="locale" value={locale} />
      )}
      {paymentChoice === "maksekeskus" && makseMethodUrl ? (
        <input type="hidden" name="maksekeskusMethodUrl" value={makseMethodUrl} />
      ) : null}
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

      {/* Delivery: contact + business + address — no inner card on mobile (outer form is the only card) */}
      <div className="max-lg:overflow-x-hidden max-lg:border-b max-lg:border-gray-100 max-lg:pb-2">
        <button
          type="button"
          className={panelBtn}
          onClick={() => setDeliveryOpen((o) => !o)}
          aria-expanded={deliveryOpen}
        >
          <div>
            <p className="text-xs font-medium text-gray-500">{t("mobile.shipTo")}</p>
            <p className="text-sm font-semibold text-black">
              {isLv ? "Kontakti un adrese" : "Contact & address"}
            </p>
          </div>
          <Chevron open={deliveryOpen} />
        </button>
        <div className={panelBody(deliveryOpen)}>
          <div className="space-y-4 pt-2 lg:pt-0">
            <section className="space-y-4">
              <h2 className="hidden text-lg font-bold text-black lg:block">
                {isLv ? "Kontaktinformācija" : "Contact"}
              </h2>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  {isLv ? "E-pasts" : "Email"}
                </label>
                <input type="email" name="email" required className={inputClassName("email")} />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  {isLv ? "Pilns vārds" : "Full name"}
                </label>
                <input type="text" name="name" required className={inputClassName("name")} />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
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
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
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
              subtotal={shippingQuoteSubtotal}
              cartFingerprint={cartFingerprint}
              errors={errors}
              locale={locale === "lv" || locale === "en" ? locale : undefined}
              includeShippingMethod={false}
              shippingCountry={shipCountry}
              onShippingCountryChange={setShipCountry}
              showAddressHeading={false}
            />
          </div>
        </div>
      </div>

      {/* Shipping method */}
      <div className="max-lg:overflow-x-hidden max-lg:border-b max-lg:border-gray-100 max-lg:pb-2">
        <button
          type="button"
          className={panelBtn}
          onClick={() => setMethodOpen((o) => !o)}
          aria-expanded={methodOpen}
        >
          <div>
            <p className="text-xs font-medium text-gray-500">{t("mobile.shippingMethod")}</p>
            <p className="text-sm font-semibold text-black">
              {currency} {shippingAmount.toFixed(2)}
            </p>
          </div>
          <Chevron open={methodOpen} />
        </button>
        <div className={panelBody(methodOpen)}>
          <div className="pt-2 lg:pt-0">
            <ShippingMethodSelector
              country={shipCountry}
              currency={currency}
              subtotal={shippingQuoteSubtotal}
              cartFingerprint={cartFingerprint}
              locale={locale === "lv" || locale === "en" ? locale : undefined}
              onShippingMethodChange={setShippingMethod}
              onShippingCostChange={setShippingAmount}
              showSectionHeading={false}
            />
          </div>
        </div>
      </div>

      <section className="space-y-3 max-lg:rounded-none max-lg:border-0 max-lg:p-0 max-lg:pt-3 max-lg:shadow-none rounded-2xl border border-gray-200 p-4 lg:border-0 lg:p-0">
        <div>
          <h2 className="text-xl font-bold text-black">{t("mobile.payment")}</h2>
          <p className="mt-1 text-xs text-gray-500">{t("mobile.paymentSecure")}</p>
        </div>

        <div className="space-y-2">
          <label className={paymentRow(paymentChoice === "stripe")}>
            <input
              type="radio"
              name="paymentMethodUi"
              className="border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
              checked={paymentChoice === "stripe"}
              onChange={() => setPaymentChoice("stripe")}
            />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
              <CardIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-black">
              {t("mobile.payWithCard")}
            </span>
            <VisaMastercardMarks />
          </label>

          {showMakseBanks ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              {makseMethods.map((m) => {
                const checked = paymentChoice === "maksekeskus" && makseMethodUrl === m.methodUrl;
                return (
                  <label
                    key={m.methodUrl}
                    className={`flex w-full cursor-pointer items-center gap-3 border-t border-gray-200 px-3 py-3 transition first:border-t-0 ${
                      checked ? "bg-[var(--mobile-cta)]/5 ring-1 ring-[var(--mobile-cta)]/30" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethodUi"
                      className="border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
                      checked={checked}
                      onChange={() => {
                        setPaymentChoice("maksekeskus");
                        setMakseMethodUrl(m.methodUrl);
                      }}
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-black">{m.label}</span>
                    <span className="shrink-0">
                      <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md border border-black/10 bg-white px-2">
                        {m.logoSrc ? (
                          <Image src={m.logoSrc} alt="" width={64} height={16} className="max-h-5 w-auto object-contain" />
                        ) : m.remoteLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.remoteLogo}
                            alt=""
                            className="max-h-5 max-w-[4.5rem] object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-gray-600">{m.label.slice(0, 3)}</span>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
              {/* Card payment via Maksekeskus selection page fallback */}
              <label
                className={`flex w-full cursor-pointer items-center gap-3 border-t border-gray-200 px-3 py-3 transition ${
                  paymentChoice === "maksekeskus" && !makseMethodUrl
                    ? "bg-[var(--mobile-cta)]/5 ring-1 ring-[var(--mobile-cta)]/30"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethodUi"
                  className="border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
                  checked={paymentChoice === "maksekeskus" && !makseMethodUrl}
                  onChange={() => {
                    setPaymentChoice("maksekeskus");
                    setMakseMethodUrl("");
                  }}
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-black">
                  {t("mobile.payWithMaksekeskus")}
                </span>
                <span className="shrink-0 text-xs font-semibold text-gray-500">MakeCommerce</span>
              </label>
            </div>
          ) : maksekeskusAvailable ? (
            <label className={paymentRow(paymentChoice === "maksekeskus")}>
              <input
                type="radio"
                name="paymentMethodUi"
                className="border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
                checked={paymentChoice === "maksekeskus"}
                onChange={() => {
                  setPaymentChoice("maksekeskus");
                  setMakseMethodUrl("");
                }}
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-black">
                {t("mobile.payWithMaksekeskus")}
              </span>
              {/* Logos handled in bank list; keep simple fallback */}
            </label>
          ) : null}

          {isBusiness ? (
            <label className={paymentRow(paymentChoice === "wire")}>
              <input
                type="radio"
                name="paymentMethodUi"
                className="border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
                checked={paymentChoice === "wire"}
                onChange={() => setPaymentChoice("wire")}
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-black">{t("mobile.payWithWire")}</span>
            </label>
          ) : null}
        </div>
      </section>

      <div className="space-y-3 pt-1">
        <div className="flex items-start gap-2">
          <input
            id="checkout-accept-terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
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
          <p className="mt-1 text-xs text-red-600">{errors.terms}</p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mobile-cta)] px-4 py-4 text-base font-semibold text-white transition hover:bg-[var(--mobile-cta-hover)] disabled:cursor-not-allowed disabled:opacity-50 lg:bg-black lg:hover:bg-gray-800"
        >
          {isSubmitting ? (
            isLv ? "Apstrādā…" : "Processing…"
          ) : (
            <>
              <span>
                {t("mobile.payNow")} | {currency} {orderTotal.toFixed(2)}
              </span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {isBusiness
          ? isLv
            ? "Izvēlieties maksājuma veidu augšā. Jūs varat tikt novirzīts uz maksājumu lapu."
            : "Pick a payment method above. You may be redirected to complete payment."
          : maksekeskusAvailable
            ? isLv
              ? "Stripe (karte) vai Maksekeskus pēc izvēles."
              : "Stripe (card) or Maksekeskus as selected."
            : isLv
              ? "Jūs tiksiet novirzīts uz Stripe apmaksu."
              : "You will be redirected to Stripe Checkout to pay."}
      </p>
    </form>
  );
}
