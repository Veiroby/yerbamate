import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { ForgotPasswordForm } from "./forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={null} />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="heading-page mb-4">Forgot your password?</h1>

        <div className="space-y-4 rounded-2xl border border-[#606C38]/20 bg-[#FEFAE0] p-6 shadow-sm">
          <p className="text-sm text-[#606C38]">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <ForgotPasswordForm />

          <p className="text-center text-sm text-[#606C38]">
            Remember your password?{" "}
            <Link href="/account/profile" className="text-[#BC6C25] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
