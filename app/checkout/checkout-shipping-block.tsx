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
};

export function CheckoutShippingBlock({
  currency = "EUR",
  subtotal,
}: Props) {
  const [country, setCountry] = useState("LV");

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
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Street address"
          />
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
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600">
              Postal code
            </label>
            <input
              type="text"
              name="postalCode"
              required
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
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
      />
    </>
  );
}
