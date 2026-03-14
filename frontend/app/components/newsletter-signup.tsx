"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
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
      setMessage(data.message ?? "Thanks for subscribing!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-wrap justify-center gap-2 sm:flex-row sm:items-start">
      <label htmlFor="newsletter-email" className="sr-only">
        Email for newsletter
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        disabled={status === "loading"}
        className="min-w-0 flex-1 rounded-lg border border-[#606C38]/40 bg-[#FEFAE0] px-4 py-2.5 text-[#283618] placeholder:text-[#606C38]/60 focus:border-[#BC6C25] focus:outline-none focus:ring-1 focus:ring-[#BC6C25] disabled:opacity-60"
        required
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="shrink-0 rounded-lg bg-[#BC6C25] px-4 py-2.5 font-medium text-[#FEFAE0] transition hover:bg-[#a55a1f] disabled:opacity-60"
      >
        {status === "loading" ? "…" : "Subscribe"}
      </button>
      {message && (
        <p
          className={`w-full text-sm ${
            status === "error" ? "text-red-600" : "text-[#283618]"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
