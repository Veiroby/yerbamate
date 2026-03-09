import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">
          Contact
        </h1>
        <p className="mb-4 text-zinc-600">
          Have a question or feedback? Get in touch.
        </p>
        <p className="text-sm text-zinc-500">
          Email: hello@yerbatea.example.com
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
