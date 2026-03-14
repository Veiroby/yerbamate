import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { ForgotPasswordForm } from "./forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader user={null} />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="font-serif mb-4 text-2xl font-semibold tracking-tight text-stone-900">
          Forgot your password?
        </h1>

        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <ForgotPasswordForm />

          <p className="text-center text-sm text-stone-500">
            Remember your password?{" "}
            <Link href="/account/profile" className="text-teal-700 hover:text-teal-800 underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
