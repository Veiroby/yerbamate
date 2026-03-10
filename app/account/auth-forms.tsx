"use client";

import Link from "next/link";
import { useState } from "react";

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

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-stone-600">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          required
          className="w-full rounded-xl border border-stone-300 px-3 py-2 pr-11 text-sm transition outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-stone-500 transition hover:text-stone-700"
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

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-stone-600">
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
        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm transition outline-none placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      <p
        id={helperId}
        className={`text-xs transition ${
          focused ? "text-teal-700" : "text-stone-500"
        }`}
      >
        Use a valid email format, for example{" "}
        <span className="font-medium">example@example.com</span>
      </p>
    </div>
  );
}

export function AuthForms({ error }: Props) {
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [focusedEmailField, setFocusedEmailField] = useState<
    "signin" | "signup" | null
  >(null);

  return (
    <div className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      {error && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error === "denied" && "Sign-in was cancelled."}
          {error === "oauth" &&
            "Something went wrong with sign-in. Please try again."}
          {error === "no_code" && "Missing authorization. Please try again."}
          {!["denied", "oauth", "no_code"].includes(error) &&
            "Something went wrong. Please try again."}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Sign in with</h2>
        <div className="grid gap-2">
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-teal-100"
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
          <span className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-stone-500">or</span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">
          Existing customers
        </h2>
        <form action="/api/auth/login" method="post" className="space-y-3">
          <EmailField
            id="login-email"
            helperId="login-email-helper"
            name="email"
            label="Email"
            focused={focusedEmailField === "signin"}
            onFocus={() => setFocusedEmailField("signin")}
            onBlur={() => setFocusedEmailField(null)}
          />
          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            visible={showSignInPassword}
            onToggle={() => setShowSignInPassword((value) => !value)}
          />
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            Sign in
          </button>
        </form>
      </section>

      <section className="space-y-3 border-t border-stone-200 pt-4">
        <h2 className="text-sm font-semibold text-stone-900">New customers</h2>
        <p className="text-xs text-stone-500">
          Create an account to save your details and view your order history.
          Guest orders with the same email will be linked automatically.
        </p>
        <form action="/api/auth/register" method="post" className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="register-name"
              className="block text-xs font-medium text-stone-600"
            >
              Name
            </label>
            <input
              id="register-name"
              type="text"
              name="name"
              placeholder="Your full name"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm transition outline-none placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <EmailField
            id="register-email"
            helperId="register-email-helper"
            name="email"
            label="Email"
            focused={focusedEmailField === "signup"}
            onFocus={() => setFocusedEmailField("signup")}
            onBlur={() => setFocusedEmailField(null)}
          />
          <PasswordField
            id="register-password"
            name="password"
            label="Password"
            visible={showSignUpPassword}
            onToggle={() => setShowSignUpPassword((value) => !value)}
          />
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Create account
          </button>
        </form>
      </section>

      <p className="text-xs text-stone-500">
        You can always checkout as a guest from the{" "}
        <Link
          href="/checkout"
          className="text-teal-700 underline hover:text-teal-800"
        >
          checkout page
        </Link>
        .
      </p>
    </div>
  );
}
