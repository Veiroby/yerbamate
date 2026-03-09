"use client";

import { useEffect, useState } from "react";
import { DpdLogo } from "@/app/components/dpd-logo";
import { DPD_PARCEL_MACHINE_METHOD_ID } from "@/lib/shipping/dpd";

type ShippingMethod = {
  id: string;
  name: string;
  amount: number;
  estimatedDays?: number | null;
};

const COUNTRY_OPTIONS = [
  { value: "LV", label: "Latvia" },
  { value: "EE", label: "Estonia" },
  { value: "LT", label: "Lithuania" },
  { value: "US", label: "United States" },
] as const;

type Props = {
  subtotal: number;
  currency: string;
};

export function CartShippingPreview({ subtotal, currency }: Props) {
  const [country, setCountry] = useState("LV");
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ country });
    if (Number.isFinite(subtotal)) params.set("subtotal", String(subtotal));
    fetch(`/api/shipping/methods?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setMethods((data.methods ?? []) as ShippingMethod[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [country, subtotal]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Shipping</span>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-label="Delivery country"
        >
          {COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-xs text-zinc-500">Loading options…</p>
      ) : methods.length === 0 ? (
        <p className="text-xs text-zinc-500">Calculated at checkout</p>
      ) : (
        <ul className="space-y-1.5">
          {methods.map((method) => (
            <li
              key={method.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-2"
            >
              <span className="flex items-center gap-2">
                {method.id === DPD_PARCEL_MACHINE_METHOD_ID && (
                  <DpdLogo size="sm" className="shrink-0" />
                )}
                <span className="text-xs font-medium text-zinc-800">
                  {method.name}
                  {method.estimatedDays != null ? (
                    <span className="ml-1 font-normal text-zinc-500">
                      · {method.estimatedDays} days
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="text-xs font-semibold text-zinc-900">
                {method.amount === 0
                  ? "Free"
                  : `${currency} ${method.amount.toFixed(2)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
