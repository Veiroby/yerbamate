import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
          Contact
        </h1>
        <p className="mb-10 text-neutral-600">
          Have a question or feedback? Send us a message and we&apos;ll get back
          to you.
        </p>
        <ContactForm />
      </main>
      <SiteFooter />
    </div>
  );
}
