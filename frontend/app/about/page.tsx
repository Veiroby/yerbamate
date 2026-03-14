import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default async function AboutPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="heading-page mb-6">About us</h1>
        <p className="leading-relaxed text-[#606C38]">
          YerbaTea is your source for premium yerba mate and mate gourds. We
          believe in natural energy and tradition. Explore our collection and
          find your perfect brew.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
