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
      <div className="tg-center" style={{ display: "grid", gap: "0.85rem" }}>
        <h1 className="tg-title">Nothing to checkout</h1>
        <Link href="/tg" className="tg-link">
          Back to catalog
        </Link>
      </div>
    );
  }

  if (orderNumber && awaitingExternalPay) {
    return (
      <div className="tg-center" style={{ display: "grid", gap: "0.9rem", justifyItems: "center" }}>
        <p className="tg-brand" style={{ fontSize: "1.05rem", margin: 0 }}>
          YerbaTea
        </p>
        <h1 className="tg-title">Complete payment</h1>
        <p className="tg-sub" style={{ maxWidth: "18rem" }}>
          Order <strong>{orderNumber}</strong> was created. Finish payment in the
          browser window that opened, then return here.
        </p>
        <Link
          href={`/tg/success?orderNumber=${encodeURIComponent(orderNumber)}`}
          className="tg-btn"
          style={{ maxWidth: "14rem" }}
        >
          I’ve paid
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div>
        <p className="tg-brand" style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>
          YerbaTea
        </p>
        <h1 className="tg-title">Checkout</h1>
        <p className="tg-sub">
          Items {formatMoney(itemsTotal, currency)}
          {shippingAmount > 0 ? ` + shipping ${formatMoney(shippingAmount, currency)}` : ""}
          {" = "}
          <strong>{formatMoney(grandTotal, currency)}</strong>
        </p>
      </div>

      <form onSubmit={submitOrder} style={{ display: "grid", gap: "1.15rem" }}>
        <section style={{ display: "grid", gap: "0.65rem" }}>
          <h2 className="tg-section__label">Contact</h2>
          <label className="tg-field">
            <span>Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tg-input"
              autoComplete="name"
            />
          </label>
          <label className="tg-field">
            <span>Phone</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tg-input"
              placeholder="+371 ..."
              autoComplete="tel"
            />
          </label>
          <label className="tg-field">
            <span>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tg-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
        </section>

        <section style={{ display: "grid", gap: "0.65rem" }}>
          <h2 className="tg-section__label">Shipping</h2>
          {shippingMethods.map((method) => (
            <label
              key={method.id}
              className="tg-choice"
              data-active={shippingOptionId === method.id}
            >
              <input
                type="radio"
                name="shipping"
                style={{ marginTop: "0.2rem" }}
                checked={shippingOptionId === method.id}
                onChange={() => {
                  setShippingOptionId(method.id);
                  if (method.id !== DPD_PARCEL_MACHINE_METHOD_ID) {
                    setDpdPickupPointId("");
                  }
                }}
              />
              <span style={{ flex: 1 }}>
                <span style={{ fontWeight: 650, display: "block" }}>{method.name}</span>
                <span className="tg-muted">
                  {method.amount <= 0 ? "Free" : formatMoney(method.amount, currency)}
                </span>
              </span>
            </label>
          ))}

          {isDpd ? (
            <div className="tg-panel" style={{ display: "grid", gap: "0.55rem" }}>
              <p style={{ margin: 0, fontWeight: 650, fontSize: "0.875rem" }}>
                DPD parcel locker
              </p>
              {pickupLoading ? (
                <p className="tg-muted">Loading lockers…</p>
              ) : (
                <>
                  <input
                    value={pickupFilter}
                    onChange={(e) => setPickupFilter(e.target.value)}
                    className="tg-input"
                    placeholder="Search city or locker…"
                  />
                  <select
                    required
                    value={dpdPickupPointId}
                    onChange={(e) => setDpdPickupPointId(e.target.value)}
                    className="tg-select"
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

        <section style={{ display: "grid", gap: "0.65rem" }}>
          <h2 className="tg-section__label">Payment</h2>
          <p className="tg-muted" style={{ margin: 0 }}>
            Card / bank payment opens in the system browser.
          </p>
          <label className="tg-choice" data-active={paymentChoice === "stripe"}>
            <input
              type="radio"
              name="payment"
              checked={paymentChoice === "stripe"}
              onChange={() => setPaymentChoice("stripe")}
            />
            <span style={{ fontWeight: 650 }}>Card (Stripe)</span>
          </label>

          {makseAvailable ? (
            <div style={{ display: "grid", gap: "0.55rem" }}>
              <label
                className="tg-choice"
                data-active={paymentChoice === "maksekeskus"}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentChoice === "maksekeskus"}
                  onChange={() => setPaymentChoice("maksekeskus")}
                />
                <span style={{ fontWeight: 650 }}>Bank link (Maksekeskus)</span>
              </label>
              {paymentChoice === "maksekeskus" && makseBanks.length > 0 ? (
                <select
                  value={makseMethodUrl}
                  onChange={(e) => setMakseMethodUrl(e.target.value)}
                  className="tg-select"
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

        <label className="tg-field">
          <span>Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="tg-textarea"
            placeholder="Delivery notes…"
          />
        </label>

        {error ? <p className="tg-error">{error}</p> : null}

        <button
          type="submit"
          disabled={
            submitting ||
            !name.trim() ||
            !phone.trim() ||
            !email.trim() ||
            (isDpd && !dpdPickupPointId)
          }
          className="tg-btn"
        >
          {submitting ? "Processing…" : `Pay ${formatMoney(grandTotal, currency)}`}
        </button>
      </form>
    </div>
  );
}
