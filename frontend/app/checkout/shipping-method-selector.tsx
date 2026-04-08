"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { DPD_PARCEL_MACHINE_METHOD_ID } from "@/lib/shipping/dpd";
import { LOCAL_PICKUP_METHOD_ID } from "@/lib/shipping/local-pickup";
import { useCart } from "@/lib/cart-context";

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
  locale,
}: {
  pickupPoints: PickupPoint[];
  pickupLoading: boolean;
  selectedPickupId: string;
  onSelect: (id: string) => void;
  required: boolean;
  locale?: "lv" | "en";
}) {
  const isLv = locale === "lv";
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
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

  useEffect(() => {
    if (!open) return;
    const el = inputRef.current;
    if (!el) return;
    const updateRect = () => {
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom - SAFE_MARGIN;
      // Always render below the input to avoid "jumping" between top/bottom.
      const maxHeight = Math.min(PREFERRED_MAX_HEIGHT, Math.max(120, spaceBelow));
      setDropdownRect({
        top: r.bottom + 4,
        left: r.left,
        width: r.width,
        maxHeight,
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
        {isLv ? "Izvēlieties pakomātu" : "Choose parcel machine"}
      </label>
      {pickupLoading ? (
        <p className="mt-1 text-xs text-zinc-500">
          {isLv ? "Notiek piegādes punktu ielāde…" : "Loading pickup points…"}
        </p>
      ) : pickupPoints.length === 0 ? (
        <p className="mt-1 text-xs text-zinc-500">
          {isLv ? "Šai valstij nav atrasti piegādes punkti." : "No pickup points found for this country."}
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
            placeholder={
              isLv
                ? "Ievadiet, lai meklētu, vai noklikšķiniet, lai pārlūkotu…"
                : "Type to search or click to browse…"
            }
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
                  top: dropdownRect.top,
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
                    {isLv
                      ? "Nav atrastu pakomātu, kas atbilst meklēšanai"
                      : "No matching parcel machines"}
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
          {isLv ? "Lūdzu, izvēlieties pakomātu" : "Please select a parcel machine"}
        </p>
      )}
    </div>
  );
}

type Props = {
  country: string;
  currency?: string;
  subtotal?: number;
  /** Server-stable id:qty signature so quotes refresh when the cart changes. */
  cartFingerprint?: string;
  onMethodsLoaded?: (methods: ShippingOption[]) => void;
  onShippingMethodChange?: (methodId: string) => void;
  /** Called when the selected method’s price is known or changes. */
  onShippingCostChange?: (amount: number) => void;
  showSectionHeading?: boolean;
  locale?: "lv" | "en";
};

export function ShippingMethodSelector({
  country,
  currency = "EUR",
  subtotal,
  cartFingerprint,
  onMethodsLoaded,
  onShippingMethodChange,
  onShippingCostChange,
  showSectionHeading = true,
  locale,
}: Props) {
  const { itemCount } = useCart();
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

  const dpdMethod = methods.find((m) => m.id === DPD_PARCEL_MACHINE_METHOD_ID);
  const pickupMethod = methods.find((m) => m.id === LOCAL_PICKUP_METHOD_ID);
  const otherMethods = methods.filter(
    (m) => m.id !== DPD_PARCEL_MACHINE_METHOD_ID && m.id !== LOCAL_PICKUP_METHOD_ID,
  );
  const pairCards = [pickupMethod, dpdMethod].filter(
    (m): m is ShippingOption => m !== undefined,
  );
  const pairGridClass =
    pairCards.length >= 2
      ? "grid min-w-0 grid-cols-2 gap-3"
      : "grid min-w-0 grid-cols-1 gap-3";

  const shortDeliveryTitle = (m: ShippingOption) => {
    if (m.id === LOCAL_PICKUP_METHOD_ID) {
      return locale === "lv" ? "Paņemšana" : "Pick up";
    }
    if (m.id === DPD_PARCEL_MACHINE_METHOD_ID) {
      return locale === "lv" ? "DPD" : "DPD";
    }
    return m.name;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ country });
    if (locale) params.set("locale", locale);
    if (subtotal != null && Number.isFinite(subtotal)) {
      params.set("subtotal", String(subtotal));
    }
    if (cartFingerprint) {
      params.set("cartFp", cartFingerprint);
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
  }, [
    country,
    subtotal,
    locale,
    cartFingerprint,
    itemCount,
    onMethodsLoaded,
    onShippingMethodChange,
  ]);

  useEffect(() => {
    const m = methods.find((x) => x.id === selectedId);
    if (m && selectedId) {
      onShippingCostChange?.(m.amount);
    }
  }, [methods, selectedId, onShippingCostChange]);

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
      <div className="text-sm text-gray-500">
        {locale === "lv" ? "Notiek piegādes iespēju ielāde…" : "Loading shipping options…"}
      </div>
    );
  }

  if (unsupportedCountry || methods.length === 0) {
    return (
      <section className="space-y-4">
        {showSectionHeading ? (
          <h2 className="text-lg font-bold text-black">
            {locale === "lv" ? "Piegādes metode" : "Shipping method"}
          </h2>
        ) : null}
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
          {locale === "lv"
            ? "Diemžēl mēs nepiegādājam uz jūsu valsti."
            : "Unfortunately we don&apos;t ship to your country."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {showSectionHeading ? (
        <h2 className="text-lg font-bold text-black">
          {locale === "lv" ? "Piegādes metode" : "Shipping method"}
        </h2>
      ) : null}
      {/* Single hidden field so fetch/FormData always sends the selected method (radios alone can omit name in edge cases). */}
      <input type="hidden" name="shippingOptionId" value={selectedId ?? ""} />

      {pairCards.length > 0 ? (
        <div className={pairGridClass}>
          {pairCards.map((method) => {
            const selected = selectedId === method.id;
            return (
              <label
                key={method.id}
                className={`flex min-w-0 cursor-pointer flex-col gap-2 rounded-3xl border p-3 text-left transition sm:p-4 ${
                  selected
                    ? "border-[var(--mobile-cta)] bg-[var(--mobile-cta)]/5 ring-2 ring-[var(--mobile-cta)]/20"
                    : "border-black/10 bg-white hover:border-black/20"
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-black">
                      {shortDeliveryTitle(method)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-600">
                      {method.id === LOCAL_PICKUP_METHOD_ID
                        ? locale === "lv"
                          ? "Stabu iela 53, Rīga"
                          : "Stabu iela 53, Riga"
                        : locale === "lv"
                          ? "Piegāde uz pakomātu"
                          : "Parcel machine delivery"}
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="shippingMethodUi"
                    value={method.id}
                    checked={selected}
                    onChange={() => handleMethodChange(method.id)}
                    className="mt-1 shrink-0 border-gray-300 text-[var(--mobile-cta)] focus:ring-[var(--mobile-cta)]"
                  />
                </span>
                <span className="text-sm font-semibold text-black">
                  {currency} {method.amount.toFixed(2)}
                  {method.estimatedDays && method.id === DPD_PARCEL_MACHINE_METHOD_ID ? (
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      {locale === "lv"
                        ? `· ~${method.estimatedDays} d.`
                        : `· ~${method.estimatedDays} bd`}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      ) : null}

      {otherMethods.length > 0 ? (
        <div className={`space-y-2 ${pairCards.length > 0 ? "mt-4" : ""}`}>
          {otherMethods.map((method) => (
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
                  name="shippingMethodUi"
                  value={method.id}
                  checked={selectedId === method.id}
                  onChange={() => handleMethodChange(method.id)}
                  className="border-gray-300 text-black focus:ring-black"
                />
                <span>
                  {method.name}
                  {method.estimatedDays ? (
                    <span className="ml-1 text-xs text-gray-500">
                      {locale === "lv"
                        ? `(${method.estimatedDays} darbadienas)`
                        : `(${method.estimatedDays} business days)`}
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
      ) : null}

      {isDpdSelected && (
        <ParcelPicker
          pickupPoints={pickupPoints}
          pickupLoading={pickupLoading}
          selectedPickupId={selectedPickupId}
          onSelect={setSelectedPickupId}
          required={isDpdSelected}
          locale={locale}
        />
      )}
    </section>
  );
}
