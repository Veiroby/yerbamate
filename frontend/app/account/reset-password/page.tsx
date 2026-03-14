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
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={null} />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="heading-page mb-4">Reset your password</h1>

        <div className="space-y-4 rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-6 shadow-sm">
          {!token ? (
            <>
              <p className="text-sm text-[#606C38]">
                Invalid or missing reset link. Please request a new password reset.
              </p>
              <Link
                href="/account/forgot-password"
                className="block text-center rounded-2xl bg-[#283618] px-4 py-2 text-sm font-medium text-[#FEFAE0] transition hover:bg-[#283618]/90"
              >
                Request new reset link
              </Link>
            </>
          ) : (
            <>
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
                  {error === "invalid_token" && "This reset link has expired or is invalid. Please request a new one."}
                  {error === "missing_fields" && "Please enter your new password."}
                  {error === "too_many_attempts" && "Too many attempts. Please try again later."}
                  {error === "password_too_short" && "Password must be at least 8 characters."}
                  {error === "password_needs_uppercase" && "Password must contain an uppercase letter."}
                  {error === "password_needs_lowercase" && "Password must contain a lowercase letter."}
                  {error === "password_needs_number" && "Password must contain a number."}
                  {![
                    "invalid_token", "missing_fields", "too_many_attempts",
                    "password_too_short", "password_needs_uppercase",
                    "password_needs_lowercase", "password_needs_number"
                  ].includes(error) && "Something went wrong. Please try again."}
                </p>
              )}

              {error === "invalid_token" ? (
                <Link
                  href="/account/forgot-password"
                  className="block text-center rounded-2xl bg-[#283618] px-4 py-2 text-sm font-medium text-[#FEFAE0] transition hover:bg-[#283618]/90"
                >
                  Request new reset link
                </Link>
              ) : (
                <>
                  <p className="text-sm text-[#606C38]">
                    Enter your new password below. It must be at least 8 characters with uppercase, lowercase, and a number.
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
