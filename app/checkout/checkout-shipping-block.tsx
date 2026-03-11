"use client";

import { useState } from "react";
import { ShippingMethodSelector } from "./shipping-method-selector";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "LV", label: "Latvia" },
  { value: "EE", label: "Estonia" },
  { value: "LT", label: "Lithuania" },
];

type Props = {
  currency?: string;
  subtotal?: number;
  errors?: Record<string, string>;
  onShippingMethodChange?: (methodId: string) => void;
};

export function CheckoutShippingBlock({
  currency = "EUR",
  subtotal,
  errors,
  onShippingMethodChange,
}: Props) {
  const [country, setCountry] = useState("LV");

  const inputClassName = (fieldName: string) =>
    `w-full rounded-xl border px-3 py-2 text-sm ${
      errors?.[fieldName]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
        : "border-zinc-300 focus:border-emerald-500 focus:ring-emerald-500"
    }`;

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">
          Shipping address
        </h2>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-600">
            Address line 1
          </label>
          <input
            type="text"
            name="addressLine1"
            required
            className={inputClassName("addressLine1")}
            placeholder="Street address"
          />
          {errors?.addressLine1 && (
            <p className="text-xs text-red-600 mt-1">{errors.addressLine1}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-600">
            Address line 2 (optional)
          </label>
          <input
            type="text"
            name="addressLine2"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600">
              City
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
            <label className="block text-xs font-medium text-zinc-600">
              Postal code
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
          <label className="block text-xs font-medium text-zinc-600">
            Country
          </label>
          <select
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <ShippingMethodSelector
        country={country}
        currency={currency}
        subtotal={subtotal}
        onShippingMethodChange={onShippingMethodChange}
      />
    </>
  );
}
