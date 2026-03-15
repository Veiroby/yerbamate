"use client";

import { useState } from "react";

type Props = {
  onCustomerTypeChange?: (type: "INDIVIDUAL" | "BUSINESS") => void;
  errors?: Record<string, string>;
};

export function CheckoutCustomerType({ onCustomerTypeChange, errors }: Props) {
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );

  const handleTypeChange = (type: "INDIVIDUAL" | "BUSINESS") => {
    setCustomerType(type);
    onCustomerTypeChange?.(type);
  };

  const isBusiness = customerType === "BUSINESS";

  const inputClassName = (fieldName: string) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm ${
      errors?.[fieldName]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
    }`;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-black">Customer type</h2>

      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="customerType"
            value="INDIVIDUAL"
            checked={customerType === "INDIVIDUAL"}
            onChange={() => handleTypeChange("INDIVIDUAL")}
            className="h-4 w-4 border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm text-gray-700">Individual</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="customerType"
            value="BUSINESS"
            checked={customerType === "BUSINESS"}
            onChange={() => handleTypeChange("BUSINESS")}
            className="h-4 w-4 border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm text-gray-700">Business</span>
        </label>
      </div>

      {isBusiness && (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Company name
            </label>
            <input
              type="text"
              name="companyName"
              required
              className={inputClassName("companyName")}
              placeholder="SIA Example Company"
            />
            {errors?.companyName && (
              <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Company address
            </label>
            <input
              type="text"
              name="companyAddress"
              required
              className={inputClassName("companyAddress")}
              placeholder="Street 1, City, LV-1000, Latvia"
            />
            {errors?.companyAddress && (
              <p className="text-xs text-red-600 mt-1">{errors.companyAddress}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">
                VAT number
              </label>
              <input
                type="text"
                name="vatNumber"
                required
                className={inputClassName("vatNumber")}
                placeholder="LV12345678901"
              />
              {errors?.vatNumber && (
                <p className="text-xs text-red-600 mt-1">{errors.vatNumber}</p>
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
                className={inputClassName("phone")}
                placeholder="+371 20000000"
              />
              {errors?.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
