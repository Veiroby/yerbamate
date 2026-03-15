"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { DPD_PARCEL_MACHINE_METHOD_ID } from "@/lib/shipping/dpd";

type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  estimatedDays?: number | null;
};

type PickupPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

function ParcelPicker({
  pickupPoints,
  pickupLoading,
  selectedPickupId,
  onSelect,
  required,
}: {
  pickupPoints: PickupPoint[];
  pickupLoading: boolean;
  selectedPickupId: string;
  onSelect: (id: string) => void;
  required: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openAbove: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = pickupPoints.find((p) => p.id === selectedPickupId);
  const searchLower = filter.trim().toLowerCase();
  const filtered = (() => {
    if (pickupPoints.length === 0) return [];

    // If no filter, show all points as-is
    if (searchLower === "") return pickupPoints;

    const minChars = 2;
    const source = searchLower.length < minChars ? pickupPoints : pickupPoints;

    const scored = source
      .map((p) => {
        const name = p.name.toLowerCase();
        const city = p.city.toLowerCase();
        const address = p.address.toLowerCase();
        const postal = p.postalCode.toLowerCase();
        const haystack = `${name} ${address} ${city} ${postal}`;
        if (!haystack.includes(searchLower)) return null;

        // Simple scoring: prioritize prefix matches on city/name, then others
        let score = 0;
        if (city.startsWith(searchLower)) score += 3;
        if (name.startsWith(searchLower)) score += 2;
        if (address.startsWith(searchLower)) score += 1;

        return { point: p, score };
      })
      .filter((x): x is { point: PickupPoint; score: number } => x !== null);

    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.point);
  })();

  const SAFE_MARGIN = 16;
  const PREFERRED_MAX_HEIGHT = 240;
  const MIN_SPACE_TO_OPEN_BELOW = 200;

  useEffect(() => {
    if (!open) return;
    const el = inputRef.current;
    if (!el) return;
    const updateRect = () => {
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom - SAFE_MARGIN;
      const spaceAbove = r.top - SAFE_MARGIN;
      const openAbove =
        spaceBelow < MIN_SPACE_TO_OPEN_BELOW || spaceBelow < spaceAbove;
      const maxHeight = Math.min(
        PREFERRED_MAX_HEIGHT,
        openAbove ? spaceAbove : spaceBelow
      );
      setDropdownRect({
        top: r.bottom + 4,
        left: r.left,
        width: r.width,
        maxHeight: Math.max(120, maxHeight),
        openAbove,
      });
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDropdownRect(null);
      return;
    }
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        listRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const displayValue = selected
    ? `${selected.name} — ${selected.address}, ${selected.city} ${selected.postalCode}`
    : "";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3">
      <label className="block text-xs font-medium text-gray-700">
        Choose parcel machine
      </label>
      {pickupLoading ? (
        <p className="mt-1 text-xs text-zinc-500">Loading pickup points…</p>
      ) : pickupPoints.length === 0 ? (
        <p className="mt-1 text-xs text-zinc-500">
          No pickup points found for this country.
        </p>
      ) : (
        <div className="relative mt-1" ref={listRef}>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="parcel-list"
            id="parcel-picker-input"
            placeholder="Type to search or click to browse…"
            value={open ? filter : displayValue}
            onChange={(e) => {
              setFilter(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setFilter("");
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <input type="hidden" name="dpdPickupPointId" value={selectedPickupId} />
          <input
            type="hidden"
            name="dpdPickupPointName"
            value={selected?.name ?? ""}
          />
          {open && dropdownRect && typeof document !== "undefined" &&
            createPortal(
              <div
                ref={listRef}
                id="parcel-list"
                role="listbox"
                className="rounded-lg border border-gray-200 bg-white shadow-lg"
                style={{
                  position: "fixed",
                  ...(dropdownRect.openAbove
                    ? {
                        bottom: window.innerHeight - dropdownRect.top + 4,
                        top: "auto",
                      }
                    : { top: dropdownRect.top }),
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                  maxHeight: dropdownRect.maxHeight,
                  overflowY: "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch",
                  zIndex: 9999,
                }}
              >
                {filtered.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    No matching parcel machines
                  </div>
                ) : (
                  filtered.map((point) => {
                    const label = `${point.name} — ${point.address}, ${point.city} ${point.postalCode}`;
                    const isSelected = point.id === selectedPickupId;
                    return (
                      <button
                        key={point.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`block w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${
                          isSelected ? "bg-gray-100 font-medium" : ""
                        }`}
                        onClick={() => {
                          onSelect(point.id);
                          setFilter("");
                          setOpen(false);
                          inputRef.current?.blur();
                        }}
                      >
                        {label}
                      </button>
                    );
                  })
                )}
              </div>,
              document.body
            )
          }
        </div>
      )}
      {required && !selectedPickupId && (
        <p className="mt-1 text-xs text-amber-600">
          Please select a parcel machine
        </p>
      )}
    </div>
  );
}

type Props = {
  country: string;
  currency?: string;
  subtotal?: number;
  onMethodsLoaded?: (methods: ShippingOption[]) => void;
  onShippingMethodChange?: (methodId: string) => void;
};

export function ShippingMethodSelector({
  country,
  currency = "EUR",
  subtotal,
  onMethodsLoaded,
  onShippingMethodChange,
}: Props) {
  const [methods, setMethods] = useState<ShippingOption[]>([]);
  const [unsupportedCountry, setUnsupportedCountry] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pickupLoading, setPickupLoading] = useState(false);

  const isDpdSelected = selectedId === DPD_PARCEL_MACHINE_METHOD_ID;

  const handleMethodChange = (methodId: string) => {
    setSelectedId(methodId);
    onShippingMethodChange?.(methodId);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ country });
    if (subtotal != null && Number.isFinite(subtotal)) {
      params.set("subtotal", String(subtotal));
    }
    fetch(`/api/shipping/methods?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data.methods ?? []) as ShippingOption[];
        setMethods(list);
        setUnsupportedCountry(Boolean(data.unsupportedCountry));
        onMethodsLoaded?.(list);
        const defaultId = list.length > 0 ? list[0].id : null;
        setSelectedId(defaultId);
        if (defaultId) onShippingMethodChange?.(defaultId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country, subtotal, onMethodsLoaded, onShippingMethodChange]);

  useEffect(() => {
    if (!isDpdSelected || !country) {
      setPickupPoints([]);
      setSelectedPickupId("");
      return;
    }
    let cancelled = false;
    setPickupLoading(true);
    fetch(
      `/api/shipping/dpd/pickup-points?country=${encodeURIComponent(country)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPickupPoints(data.pickupPoints ?? []);
        setSelectedPickupId("");
      })
      .finally(() => {
        if (!cancelled) setPickupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDpdSelected, country]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading shipping options…</div>
    );
  }

  if (unsupportedCountry || methods.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-black">Shipping method</h2>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
          Unfortunately we don&apos;t ship to your country.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-black">Shipping method</h2>
      <div className="space-y-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
              selectedId === method.id
                ? "border-black bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="shippingOptionId"
                value={method.id}
                checked={selectedId === method.id}
                onChange={() => handleMethodChange(method.id)}
                className="border-gray-300 text-black focus:ring-black"
              />
              <span>
                {method.name}
                {method.estimatedDays ? (
                  <span className="ml-1 text-xs text-gray-500">
                    ({method.estimatedDays} business days)
                  </span>
                ) : null}
              </span>
            </span>
            <span className="font-medium text-black">
              {currency} {method.amount.toFixed(2)}
            </span>
          </label>
        ))}
      </div>

      {isDpdSelected && (
        <ParcelPicker
          pickupPoints={pickupPoints}
          pickupLoading={pickupLoading}
          selectedPickupId={selectedPickupId}
          onSelect={setSelectedPickupId}
          required={isDpdSelected}
        />
      )}
    </section>
  );
}
