"use client";

import { useState } from "react";

type Variant = "default" | "dark";

export function NewsletterSignup({ variant = "default" }: { variant?: Variant }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isDark = variant === "dark";

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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="newsletter-email" className="sr-only">
        Email for newsletter
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={isDark ? "Enter your email address" : "Your email"}
        disabled={status === "loading"}
        className={`min-w-0 flex-1 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-60 ${
          isDark
            ? "border border-gray-600 bg-white text-gray-900 placeholder:text-gray-500 focus:ring-white"
            : "border border-[#606C38]/40 bg-[#FEFAE0] text-[#283618] placeholder:text-[#606C38]/60 focus:border-[#BC6C25] focus:ring-[#BC6C25]"
        }`}
        required
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`shrink-0 rounded-md px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
          isDark
            ? "bg-white text-black hover:bg-gray-100"
            : "bg-[#BC6C25] text-[#FEFAE0] hover:bg-[#a55a1f]"
        }`}
      >
        {status === "loading" ? "…" : isDark ? "Subscribe to Newsletter" : "Subscribe"}
      </button>
      {message && (
        <p
          className={`w-full text-sm ${
            status === "error" ? "text-red-400" : isDark ? "text-gray-300" : "text-[#283618]"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
