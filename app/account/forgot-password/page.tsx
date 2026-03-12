import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

type Props = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { status, error } = await searchParams;
  const emailSent = status === "sent";

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader user={null} />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="font-serif mb-4 text-2xl font-semibold tracking-tight text-stone-900">
          Forgot your password?
        </h1>

        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          {emailSent ? (
            <>
              <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
                <p className="font-medium">Check your email</p>
                <p className="mt-1 text-teal-700">
                  If an account exists with that email, we&apos;ve sent you a link to reset your password.
                </p>
              </div>
              <p className="text-sm text-stone-600">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <Link href="/account/forgot-password" className="text-teal-700 hover:text-teal-800 underline">
                  try again
                </Link>.
              </p>
              <Link
                href="/account/profile"
                className="block text-center rounded-2xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-teal-500 hover:text-teal-700"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-stone-600">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
                  {error === "missing_email" && "Please enter your email address."}
                  {!["missing_email"].includes(error) && "Something went wrong. Please try again."}
                </p>
              )}

              <form action="/api/auth/forgot-password" method="post" className="space-y-4">
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
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm transition outline-none placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                >
                  Send reset link
                </button>
              </form>

              <p className="text-center text-sm text-stone-500">
                Remember your password?{" "}
                <Link href="/account/profile" className="text-teal-700 hover:text-teal-800 underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
