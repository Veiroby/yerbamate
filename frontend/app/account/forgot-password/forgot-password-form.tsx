"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || submitted) return;

    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: formData,
      });

      if (response.redirected) {
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
          <p className="font-medium">Check your email</p>
          <p className="mt-1 text-teal-700">
            If an account exists with that email, we&apos;ve sent you a link to reset your password.
          </p>
        </div>
        <p className="text-sm text-stone-600">
          Didn&apos;t receive the email? Check your spam folder or refresh this page to try again.
        </p>
        <a
          href="/account/profile"
          className="block text-center rounded-2xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-teal-500 hover:text-teal-700"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs font-medium text-stone-600">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="example@example.com"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm transition outline-none placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-stone-100 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-2xl bg-[#344e41] px-4 py-2 text-sm font-medium text-[#dad7cd] transition hover:bg-[#24352b] disabled:bg-[#4e6a5a] disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
