"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

type Props = {
  error?: string;
};

function PasswordField(props: {
  id: string;
  name: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const { id, name, label, visible, onToggle } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-gray-600">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-11 text-sm outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? t("account.hidePassword") : t("account.showPassword")}
          className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-gray-500 transition hover:text-gray-700"
        >
          {visible ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M10.58 10.58A2 2 0 0012 16a2 2 0 001.42-.58"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M9.88 5.09A10.94 10.94 0 0112 4.91c4.78 0 8.77 3.22 10 7.59a10.58 10.58 0 01-4.16 5.94M6.1 6.1C3.85 7.49 2.21 9.72 1.5 12.5a10.6 10.6 0 003.85 5.51"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M1.5 12.5C2.73 8.13 6.72 4.91 11.5 4.91S20.27 8.13 21.5 12.5c-1.23 4.37-5.22 7.59-10 7.59S2.73 16.87 1.5 12.5z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="11.5"
                cy="12.5"
                r="3"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function EmailField(props: {
  id: string;
  helperId: string;
  name: string;
  label: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const { id, helperId, name, label, focused, onFocus, onBlur } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-gray-600">
        {label}
      </label>
      <input
        id={id}
        type="email"
        name={name}
        required
        inputMode="email"
        autoComplete="email"
        placeholder="example@example.com"
        aria-describedby={helperId}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
      />
      <p
        id={helperId}
        className={`text-xs transition ${focused ? "text-gray-900" : "text-gray-500"}`}
      >
        {t("account.emailHelper", { example: "example@example.com" })}{" "}
        <span className="font-medium">example@example.com</span>
      </p>
    </div>
  );
}

export function AuthForms({ error }: Props) {
  const pathname = usePathname();
  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const pathLocale = pathname?.match(/^\/(lv|en)/)?.[1];
  const locale: Locale = pathLocale === "lv" || pathLocale === "en" ? pathLocale : DEFAULT_LOCALE;
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [focusedEmailField, setFocusedEmailField] = useState<
    "signin" | "signup" | null
  >(null);
  const { t } = useTranslation();

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error === "denied" && t("account.errorSignInCancelled")}
          {error === "oauth" &&
            t("account.errorSignInOauth")}
          {error === "no_code" && t("account.errorMissingAuthCode")}
          {error === "invalid_credentials" &&
            t("account.errorInvalidCredentials")}
          {error === "missing_fields" &&
            t("account.errorLoginMissingFields")}
          {error === "too_many_attempts" &&
            t("account.errorTooManyAttempts")}
          {error === "register_missing_fields" &&
            t("account.errorRegisterMissingFields")}
          {error === "password_too_short" &&
            t("account.errorPasswordTooShort")}
          {error === "password_needs_uppercase" &&
            t("account.errorPasswordUppercase")}
          {error === "password_needs_lowercase" &&
            t("account.errorPasswordLowercase")}
          {error === "password_needs_number" &&
            t("account.errorPasswordNumber")}
          {error === "email_exists" &&
            t("account.errorEmailExists")}
          {![
            "denied", "oauth", "no_code", "invalid_credentials", "missing_fields",
            "too_many_attempts", "register_missing_fields", "password_too_short",
            "password_needs_uppercase", "password_needs_lowercase", "password_needs_number",
            "email_exists"
          ].includes(error) && t("account.errorGeneric")}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-black">{t("account.signInWith")}</h2>
        <div className="grid gap-2">
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </a>
        </div>
      </section>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">{t("account.or")}</span>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-black">
          {t("account.existingCustomers")}
        </h2>
        <form action="/api/auth/login" method="post" className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <EmailField
            id="login-email"
            helperId="login-email-helper"
            name="email"
            label={t("common.email")}
            focused={focusedEmailField === "signin"}
            onFocus={() => setFocusedEmailField("signin")}
            onBlur={() => setFocusedEmailField(null)}
          />
          <PasswordField
            id="login-password"
            name="password"
            label={t("account.newPassword")}
            visible={showSignInPassword}
            onToggle={() => setShowSignInPassword((value) => !value)}
          />
          <div className="flex items-center justify-end">
            <Link
              href={localePrefix ? `${localePrefix}/account/forgot-password` : "/account/forgot-password"}
              className="text-xs font-medium text-black underline hover:no-underline"
            >
              {t("account.forgotPassword")}
            </Link>
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {t("account.signIn")}
          </button>
        </form>
      </section>

      <section className="space-y-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-black">
          {t("account.newCustomers")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("account.newCustomersIntro")}
        </p>
        <form action="/api/auth/register" method="post" className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="space-y-2">
            <label
              htmlFor="register-name"
              className="block text-xs font-medium text-gray-600"
            >
              {t("common.name")}
            </label>
            <input
              id="register-name"
              type="text"
              name="name"
              placeholder={t("account.nameFullPlaceholder")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <EmailField
            id="register-email"
            helperId="register-email-helper"
            name="email"
            label={t("common.email")}
            focused={focusedEmailField === "signup"}
            onFocus={() => setFocusedEmailField("signup")}
            onBlur={() => setFocusedEmailField(null)}
          />
          <PasswordField
            id="register-password"
            name="password"
            label={t("account.newPassword")}
            visible={showSignUpPassword}
            onToggle={() => setShowSignUpPassword((value) => !value)}
          />
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-full border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-50"
          >
            {t("account.createAccount")}
          </button>
        </form>
      </section>

      <p className="text-sm text-gray-500">
        {t("account.guestCheckoutHint")}{" "}
        <Link
          href={localePrefix ? `${localePrefix}/checkout` : "/checkout"}
          className="font-medium text-black underline hover:no-underline"
        >
          {t("account.checkoutPage")}
        </Link>
        .
      </p>
    </div>
  );
}
