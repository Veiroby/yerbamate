"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";

type Props = {
  token: string;
};

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const profilePath = localePrefix ? `${localePrefix}/account/profile` : "/account/profile";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (success && countdown === 0) {
      router.push(profilePath);
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || success) return;

    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = (form.querySelector("#confirm-password") as HTMLInputElement)?.value || "";

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: formData,
      });

      const url = new URL(response.url);
      const errorParam = url.searchParams.get("error");
      const statusParam = url.searchParams.get("status");

      if (errorParam) {
        const errorMessages: Record<string, string> = {
          invalid_token: "This reset link has expired or is invalid. Please request a new one.",
          missing_fields: "Please enter your new password.",
          too_many_attempts: "Too many attempts. Please try again later.",
          password_too_short: "Password must be at least 8 characters.",
          password_needs_uppercase: "Password must contain an uppercase letter.",
          password_needs_lowercase: "Password must contain a lowercase letter.",
          password_needs_number: "Password must contain a number.",
        };
        setError(errorMessages[errorParam] || "Something went wrong. Please try again.");
      } else if (statusParam === "password_reset" || url.pathname.includes("account/profile")) {
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">{t("account.passwordResetSuccessTitle")}</p>
          <p className="mt-1 text-green-700">
            {t("account.redirectingIn", { count: countdown })}
          </p>
        </div>
        <a
          href={profilePath}
          className="block text-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("account.signInNow")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="block text-xs font-medium text-gray-600">
          {t("account.newPassword")}
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            minLength={8}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-gray-500 transition hover:text-gray-700"
          >
            {showPassword ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10.58 10.58A2 2 0 0012 16a2 2 0 001.42-.58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9.88 5.09A10.94 10.94 0 0112 4.91c4.78 0 8.77 3.22 10 7.59a10.58 10.58 0 01-4.16 5.94M6.1 6.1C3.85 7.49 2.21 9.72 1.5 12.5a10.6 10.6 0 003.85 5.51" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M1.5 12.5C2.73 8.13 6.72 4.91 11.5 4.91S20.27 8.13 21.5 12.5c-1.23 4.37-5.22 7.59-10 7.59S2.73 16.87 1.5 12.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11.5" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-600">
          {t("account.confirmPassword")}
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={8}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? t("account.hidePassword") : t("account.showPassword")}
            className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-gray-500 transition hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10.58 10.58A2 2 0 0012 16a2 2 0 001.42-.58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9.88 5.09A10.94 10.94 0 0112 4.91c4.78 0 8.77 3.22 10 7.59a10.58 10.58 0 01-4.16 5.94M6.1 6.1C3.85 7.49 2.21 9.72 1.5 12.5a10.6 10.6 0 003.85 5.51" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M1.5 12.5C2.73 8.13 6.72 4.91 11.5 4.91S20.27 8.13 21.5 12.5c-1.23 4.37-5.22 7.59-10 7.59S2.73 16.87 1.5 12.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11.5" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Password must be at least 8 characters with uppercase, lowercase, and a number.
      </p>

      // at the bottom of app/account/reset-password/reset-password-form.tsx

<button
  type="submit"
  disabled={isSubmitting}
  className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting ? (
    <>
      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Resetting...
    </>
  ) : (
    t("account.resetPasswordButton")
  )}
</button>
    </form>
  );
}
