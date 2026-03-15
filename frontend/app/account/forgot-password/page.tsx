import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { ForgotPasswordForm } from "./forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1a1a1a]">
      <SiteHeader user={null} />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-black">
          Forgot your password?
        </h1>

        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <ForgotPasswordForm />

          <p className="text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/account/profile" className="font-medium text-black underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
