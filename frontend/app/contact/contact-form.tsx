"use client";

import { useState } from "react";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (form: HTMLFormElement): boolean => {
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim() ?? "";
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim() ?? "";
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = "Name is required.";
    if (!email) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    if (!validate(form)) return;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const orderNumber = (form.elements.namedItem("orderNumber") as HTMLInputElement).value.trim() || undefined;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, orderNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      form.reset();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-neutral-300 focus:border-black focus:ring-black"
    }`;

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Message sent.</p>
        <p className="mt-1 text-green-700">
          We&apos;ll get back to you at your email address soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          className={inputClass("name")}
          placeholder="Your name"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className={inputClass("email")}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="contact-orderNumber" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Order number <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          id="contact-orderNumber"
          type="text"
          name="orderNumber"
          autoComplete="off"
          className={inputClass("orderNumber")}
          placeholder="e.g. ORD-12345"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-black px-4 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
