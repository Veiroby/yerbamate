"use client";

import { useState } from "react";

type Props = {
  onCustomerTypeChange?: (type: "INDIVIDUAL" | "BUSINESS") => void;
};

export function CheckoutCustomerType({ onCustomerTypeChange }: Props) {
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );

  const handleTypeChange = (type: "INDIVIDUAL" | "BUSINESS") => {
    setCustomerType(type);
    onCustomerTypeChange?.(type);
  };

  const isBusiness = customerType === "BUSINESS";

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900">Customer type</h2>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="customerType"
            value="INDIVIDUAL"
            checked={customerType === "INDIVIDUAL"}
            onChange={() => handleTypeChange("INDIVIDUAL")}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Individual</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="customerType"
            value="BUSINESS"
            checked={customerType === "BUSINESS"}
            onChange={() => handleTypeChange("BUSINESS")}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Business</span>
        </label>
      </div>

      {isBusiness && (
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600">
              Company name
            </label>
            <input
              type="text"
              name="companyName"
              required
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="SIA Example Company"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600">
              Company address
            </label>
            <input
              type="text"
              name="companyAddress"
              required
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Street 1, City, LV-1000, Latvia"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                VAT number
              </label>
              <input
                type="text"
                name="vatNumber"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                placeholder="LV12345678901"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                Phone number
              </label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                placeholder="+371 20000000"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
