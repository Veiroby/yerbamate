"use client";

import { useState } from "react";

export function CartReminder() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage("We’ll send you a reminder if you don’t checkout.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor="cart-reminder-email" className="sr-only">
        Email for cart reminder
      </label>
      <input
        id="cart-reminder-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email me a reminder"
        disabled={status === "loading" || status === "success"}
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="shrink-0 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-300 disabled:opacity-60"
      >
        {status === "loading" ? "…" : status === "success" ? "Saved" : "Remind me"}
      </button>
      {message && status !== "success" && (
        <p className="w-full text-xs text-red-600">{message}</p>
      )}
    </form>
  );
}
