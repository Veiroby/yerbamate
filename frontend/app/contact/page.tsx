import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="heading-page mb-6">Contact</h1>
        <p className="mb-4 leading-relaxed text-[#606C38]">
          Have a question or feedback? Get in touch.
        </p>
        <p className="text-sm text-[#606C38]/80">
          Email: hello@yerbatea.example.com
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
