"use client";

import { useState } from "react";

type Props = {
  subscriberTotal: number;
  resendConfigured: boolean;
};

export function NewArrivalsEmailForm({ subscriberTotal, resendConfigured }: Props) {
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!resendConfigured) {
    return null;
  }

  async function handleSend() {
    if (subscriberTotal === 0) {
      setStatus("error");
      setMessage("No newsletter subscribers yet.");
      return;
    }
    if (
      !confirm(
        `Send the “new arrivals” email to all ${subscriberTotal} newsletter subscribers? This uses the same branded template as other store emails.`,
      )
    ) {
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/admin/email-new-arrivals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Request failed");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "Sent.");
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-5">
      <h3 className="text-sm font-semibold text-stone-900">New arrivals blast</h3>
      <p className="mt-1 text-sm text-stone-600">
        Emails every newsletter subscriber with products added in the window below (active, not archived).
        Uses the YerbaTea branded template with images and links.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="new-days" className="block text-xs font-medium text-stone-600">
            Days to look back
          </label>
          <input
            id="new-days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 30)}
            className="mt-1 w-28 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={status === "sending" || subscriberTotal === 0}
          className="rounded-2xl bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Email subscribers about new products"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${status === "success" ? "text-teal-700" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
