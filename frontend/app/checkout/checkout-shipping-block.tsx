"use client";

import { useMemo, useState } from "react";
import { ShippingMethodSelector } from "./shipping-method-selector";
import { useLocale } from "@/lib/locale-context";
import { EU_COUNTRIES } from "@/lib/locale-data";

type Props = {
  currency?: string;
  subtotal?: number;
  errors?: Record<string, string>;
  onShippingMethodChange?: (methodId: string) => void;
  locale?: "lv" | "en";
};

export function CheckoutShippingBlock({
  currency = "EUR",
  subtotal,
  errors,
  onShippingMethodChange,
  locale,
}: Props) {
  const { country: globalCountry } = useLocale();
  const [country, setCountry] = useState(globalCountry);
  const isLv = locale === "lv";

  const regionDisplayNames = useMemo(() => {
    if (!isLv) return null;
    const DisplayNamesCtor = (Intl as any).DisplayNames as
      | undefined
      | (new (locales: string[], options: { type: string }) => {
          of: (code: string) => string | undefined;
        });
    if (!DisplayNamesCtor) return null;
    return new DisplayNamesCtor(["lv"], { type: "region" });
  }, [isLv]);

  const inputClassName = (fieldName: string) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm ${
      errors?.[fieldName]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
    }`;

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-black">
          {isLv ? "Piegādes adrese" : "Shipping address"}
        </h2>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            {isLv ? "Adrese (iela un nams)" : "Address line 1"}
          </label>
          <input
            type="text"
            name="addressLine1"
            required
            className={inputClassName("addressLine1")}
            placeholder={isLv ? "Iela un māja" : "Street address"}
          />
          {errors?.addressLine1 && (
            <p className="text-xs text-red-600 mt-1">{errors.addressLine1}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            {isLv ? "Adrese 2 (papildu informācija)" : "Address line 2 (optional)"}
          </label>
          <input
            type="text"
            name="addressLine2"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              {isLv ? "Pilsēta" : "City"}
            </label>
            <input
              type="text"
              name="city"
              required
              className={inputClassName("city")}
            />
            {errors?.city && (
              <p className="text-xs text-red-600 mt-1">{errors.city}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              {isLv ? "Pasta indekss" : "Postal code"}
            </label>
            <input
              type="text"
              name="postalCode"
              required
              className={inputClassName("postalCode")}
            />
            {errors?.postalCode && (
              <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            {isLv ? "Valsts" : "Country"}
          </label>
          <select
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value as typeof country)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            {EU_COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {regionDisplayNames?.of(c.value) ?? c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <ShippingMethodSelector
        country={country}
        currency={currency}
        subtotal={subtotal}
        locale={locale}
        onShippingMethodChange={onShippingMethodChange}
      />
    </>
  );
}
