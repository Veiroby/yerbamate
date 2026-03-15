import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { ResetPasswordForm } from "./reset-password-form";

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1a1a1a]">
      <SiteHeader user={null} />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-black">
          Reset your password
        </h1>

        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          {!token ? (
            <>
              <p className="text-sm text-gray-600">
                Invalid or missing reset link. Please request a new password reset.
              </p>
              <Link
                href="/account/forgot-password"
                className="block text-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Request new reset link
              </Link>
            </>
          ) : (
            <>
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                  {error === "invalid_token" &&
                    "This reset link has expired or is invalid. Please request a new one."}
                  {error === "missing_fields" && "Please enter your new password."}
                  {error === "too_many_attempts" &&
                    "Too many attempts. Please try again later."}
                  {error === "password_too_short" &&
                    "Password must be at least 8 characters."}
                  {error === "password_needs_uppercase" &&
                    "Password must contain an uppercase letter."}
                  {error === "password_needs_lowercase" &&
                    "Password must contain a lowercase letter."}
                  {error === "password_needs_number" &&
                    "Password must contain a number."}
                  {![
                    "invalid_token",
                    "missing_fields",
                    "too_many_attempts",
                    "password_too_short",
                    "password_needs_uppercase",
                    "password_needs_lowercase",
                    "password_needs_number",
                  ].includes(error) && "Something went wrong. Please try again."}
                </p>
              )}

              {error === "invalid_token" ? (
                <Link
                  href="/account/forgot-password"
                  className="block text-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Request new reset link
                </Link>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Enter your new password below. It must be at least 8 characters
                    with uppercase, lowercase, and a number.
                  </p>
                  <ResetPasswordForm token={token} />
                </>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
