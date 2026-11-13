"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../components/CartProvider";
import { formatMoney } from "../lib/price";
import { useTelegramWebApp } from "../lib/telegram";

export default function TgCheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const webApp = useTelegramWebApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const currency = items[0]?.product.currency || "EUR";

  useEffect(() => {
    if (!webApp) return;
    try {
      webApp.MainButton.hide();
    } catch {
      // ignore outside Telegram
    }
  }, [webApp]);

  async function submitOrder(event?: FormEvent) {
    event?.preventDefault();
    if (!name.trim() || !phone.trim() || items.length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tg/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        orderNumber?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      clearCart();
      setOrderNumber(data.orderNumber ?? "OK");
      try {
        webApp?.HapticFeedback.notificationOccurred("success");
      } catch {
        // ignore
      }
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

  if (orderNumber) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Order received
        </h1>
        <p className="text-sm text-black/55">
          Order <span className="font-semibold text-[var(--black-forest,#283618)]">{orderNumber}</span>{" "}
          is pending. We’ll confirm by phone.
        </p>
        <button
          type="button"
          onClick={() => router.push("/tg")}
          className="rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Back to catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-black/55">
          Total {formatMoney(total, currency)} · pay later / confirm by phone
        </p>
      </div>

      <form onSubmit={submitOrder} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[var(--copper,#BC6C25)]"
            placeholder="Your name"
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
            className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[var(--copper,#BC6C25)]"
            placeholder="+371 ..."
            autoComplete="tel"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[var(--copper,#BC6C25)]"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-[var(--copper,#BC6C25)]"
            placeholder="Pickup time, delivery notes…"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !phone.trim()}
          className="w-full rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-55"
        >
          {submitting ? "Sending…" : `Place order · ${formatMoney(total, currency)}`}
        </button>
      </form>
    </div>
  );
}
