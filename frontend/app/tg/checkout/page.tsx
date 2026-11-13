"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../components/CartProvider";
import { formatMoney } from "../lib/price";
import { useTelegramWebApp } from "../lib/telegram";
import { DPD_PARCEL_MACHINE_METHOD_ID } from "@/lib/shipping/dpd-constants";
import { LOCAL_PICKUP_METHOD_ID } from "@/lib/shipping/local-pickup";

type ShippingMethod = {
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

type PaymentChoice = "stripe" | "maksekeskus";

type MakseBank = {
  label: string;
  methodUrl: string;
  logoSrc?: string | null;
};

function openPaymentUrl(
  webApp: ReturnType<typeof useTelegramWebApp>,
  url: string,
) {
  try {
    if (webApp?.openLink) {
      webApp.openLink(url, { try_instant_view: false });
      return;
    }
  } catch {
    // fall through
  }
  window.location.href = url;
}

export default function TgCheckoutPage() {
  const router = useRouter();
  const { items, total: itemsTotal, clearCart } = useCart();
  const webApp = useTelegramWebApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [country] = useState("LV");

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingOptionId, setShippingOptionId] = useState(LOCAL_PICKUP_METHOD_ID);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [dpdPickupPointId, setDpdPickupPointId] = useState("");
  const [pickupFilter, setPickupFilter] = useState("");

  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("stripe");
  const [makseAvailable, setMakseAvailable] = useState(false);
  const [makseBanks, setMakseBanks] = useState<MakseBank[]>([]);
  const [makseMethodUrl, setMakseMethodUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [awaitingExternalPay, setAwaitingExternalPay] = useState(false);

  const currency = items[0]?.product.currency || "EUR";
  const selectedShipping = shippingMethods.find((m) => m.id === shippingOptionId);
  const shippingAmount = selectedShipping?.amount ?? 0;
  const grandTotal = Math.round((itemsTotal + shippingAmount) * 100) / 100;
  const isDpd = shippingOptionId === DPD_PARCEL_MACHINE_METHOD_ID;

  const filteredPoints = useMemo(() => {
    const q = pickupFilter.trim().toLowerCase();
    if (!q) return pickupPoints.slice(0, 80);
    return pickupPoints
      .filter((p) =>
        `${p.name} ${p.address} ${p.city} ${p.postalCode}`.toLowerCase().includes(q),
      )
      .slice(0, 80);
  }, [pickupPoints, pickupFilter]);

  useEffect(() => {
    if (!webApp) return;
    try {
      webApp.MainButton.hide();
    } catch {
      // ignore
    }
  }, [webApp]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/tg/shipping-methods?country=${encodeURIComponent(country)}&subtotal=${itemsTotal}&locale=en`,
        );
        const data = (await res.json()) as { methods?: ShippingMethod[] };
        if (cancelled) return;
        const methods = data.methods ?? [];
        setShippingMethods(methods);
        if (methods.length && !methods.some((m) => m.id === shippingOptionId)) {
          setShippingOptionId(methods[0]!.id);
        }
      } catch {
        if (!cancelled) setShippingMethods([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, itemsTotal]);

  useEffect(() => {
    if (!isDpd) return;
    let cancelled = false;
    setPickupLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/shipping/dpd/pickup-points?country=${encodeURIComponent(country)}`,
        );
        const data = (await res.json()) as { pickupPoints?: PickupPoint[] };
        if (!cancelled) setPickupPoints(data.pickupPoints ?? []);
      } catch {
        if (!cancelled) setPickupPoints([]);
      } finally {
        if (!cancelled) setPickupLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDpd, country]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/payments/maksekeskus/methods", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setMakseAvailable(false);
          return;
        }
        const data = (await res.json()) as {
          methods?: Array<{
            name?: string;
            display_name?: string | null;
            url?: string | null;
            logo_url?: string | null;
            category?: string | null;
          }>;
        };
        const banks: MakseBank[] = (data.methods ?? [])
          .filter((m) => m.url && (m.category === "banklinks" || !m.category))
          .filter((m) => Boolean(m.url))
          .map((m) => ({
            label: (m.display_name || m.name || "Bank").trim(),
            methodUrl: m.url!,
            logoSrc: m.logo_url ?? null,
          }));
        if (cancelled) return;
        // Configured shop can still offer redirect page even with empty bank list
        setMakseAvailable(true);
        setMakseBanks(banks);
      })
      .catch(() => {
        if (!cancelled) setMakseAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitOrder(event?: FormEvent) {
    event?.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || items.length === 0 || submitting) {
      return;
    }
    if (isDpd && !dpdPickupPointId) {
      setError("Please select a DPD parcel locker");
      return;
    }
    if (paymentChoice === "maksekeskus" && !makseAvailable) {
      setError("Bank payment is temporarily unavailable");
      return;
    }

    setSubmitting(true);
    setError(null);

    const selectedPoint = pickupPoints.find((p) => p.id === dpdPickupPointId);

    try {
      const response = await fetch("/api/tg/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          notes: notes.trim() || undefined,
          country,
          shippingOptionId,
          dpdPickupPointId: isDpd ? dpdPickupPointId : undefined,
          dpdPickupPointName: isDpd ? selectedPoint?.name : undefined,
          paymentMethod: paymentChoice,
          maksekeskusMethodUrl:
            paymentChoice === "maksekeskus" ? makseMethodUrl || undefined : undefined,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        orderNumber?: string;
        redirectUrl?: string;
        openExternal?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      clearCart();
      setOrderNumber(data.orderNumber ?? "OK");

      if (data.redirectUrl) {
        setAwaitingExternalPay(true);
        openPaymentUrl(webApp, data.redirectUrl);
        try {
          webApp?.HapticFeedback.notificationOccurred("success");
        } catch {
          // ignore
        }
        return;
      }

      try {
        webApp?.HapticFeedback.notificationOccurred("success");
      } catch {
        // ignore
      }
      router.push(`/tg/success?orderNumber=${encodeURIComponent(data.orderNumber ?? "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      try {
        webApp?.HapticFeedback.notificationOccurred("error");
      } catch {
        // ignore
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !orderNumber) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-xl font-semibold">Nothing to checkout</h1>
        <Link href="/tg" className="text-sm text-[var(--copper,#BC6C25)]">
          Back to catalog
        </Link>
      </div>
    );
  }

  if (orderNumber && awaitingExternalPay) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Complete payment
        </h1>
        <p className="text-sm text-black/55">
          Order <span className="font-semibold">{orderNumber}</span> was created. Finish
          payment in the browser window that opened, then return here.
        </p>
        <Link
          href={`/tg/success?orderNumber=${encodeURIComponent(orderNumber)}`}
          className="inline-block rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          I’ve paid
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[var(--copper,#BC6C25)]";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-black/55">
          Items {formatMoney(itemsTotal, currency)}
          {shippingAmount > 0 ? ` + shipping ${formatMoney(shippingAmount, currency)}` : ""}
          {" = "}
          <span className="font-semibold text-[var(--black-forest,#283618)]">
            {formatMoney(grandTotal, currency)}
          </span>
        </p>
      </div>

      <form onSubmit={submitOrder} className="space-y-4">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--olive,#606C38)]">
            Contact
          </h2>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoComplete="name"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Phone</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+371 ..."
              autoComplete="tel"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--olive,#606C38)]">
            Shipping
          </h2>
          <div className="space-y-2">
            {shippingMethods.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm ${
                  shippingOptionId === method.id
                    ? "border-[var(--copper,#BC6C25)] bg-[var(--cornsilk,#FEFAE0)]"
                    : "border-black/10 bg-white/70"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  className="mt-1"
                  checked={shippingOptionId === method.id}
                  onChange={() => {
                    setShippingOptionId(method.id);
                    if (method.id !== DPD_PARCEL_MACHINE_METHOD_ID) {
                      setDpdPickupPointId("");
                    }
                  }}
                />
                <span className="flex-1">
                  <span className="font-medium">{method.name}</span>
                  <span className="mt-0.5 block text-xs text-black/50">
                    {method.amount <= 0
                      ? "Free"
                      : formatMoney(method.amount, currency)}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {isDpd ? (
            <div className="space-y-2 rounded-xl border border-black/10 bg-white/70 p-3">
              <p className="text-sm font-medium">DPD parcel locker</p>
              {pickupLoading ? (
                <p className="text-xs text-black/50">Loading lockers…</p>
              ) : (
                <>
                  <input
                    value={pickupFilter}
                    onChange={(e) => setPickupFilter(e.target.value)}
                    className={inputClass}
                    placeholder="Search city or locker…"
                  />
                  <select
                    required
                    value={dpdPickupPointId}
                    onChange={(e) => setDpdPickupPointId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a locker</option>
                    {filteredPoints.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.city} ({p.postalCode})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--olive,#606C38)]">
            Payment
          </h2>
          <p className="text-xs text-black/45">
            Card / bank payment opens in the system browser (more reliable in Telegram).
          </p>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
              paymentChoice === "stripe"
                ? "border-[var(--copper,#BC6C25)] bg-[var(--cornsilk,#FEFAE0)]"
                : "border-black/10 bg-white/70"
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentChoice === "stripe"}
              onChange={() => setPaymentChoice("stripe")}
            />
            <span className="font-medium">Card (Stripe)</span>
          </label>

          {makseAvailable ? (
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                  paymentChoice === "maksekeskus"
                    ? "border-[var(--copper,#BC6C25)] bg-[var(--cornsilk,#FEFAE0)]"
                    : "border-black/10 bg-white/70"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentChoice === "maksekeskus"}
                  onChange={() => setPaymentChoice("maksekeskus")}
                />
                <span className="font-medium">Bank link (Maksekeskus)</span>
              </label>
              {paymentChoice === "maksekeskus" && makseBanks.length > 0 ? (
                <select
                  value={makseMethodUrl}
                  onChange={(e) => setMakseMethodUrl(e.target.value)}
                  className={inputClass}
                >
                  <option value="">All banks / provider page</option>
                  {makseBanks.map((b) => (
                    <option key={b.methodUrl} value={b.methodUrl}>
                      {b.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}
        </section>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Delivery notes…"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={
            submitting ||
            !name.trim() ||
            !phone.trim() ||
            !email.trim() ||
            (isDpd && !dpdPickupPointId)
          }
          className="w-full rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-55"
        >
          {submitting
            ? "Processing…"
            : `Pay ${formatMoney(grandTotal, currency)}`}
        </button>
      </form>
    </div>
  );
}
