import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default async function AboutPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">About us</h1>
        <p className="text-zinc-600">
          YerbaTea is your source for premium yerba mate and mate gourds. We
          believe in natural energy and tradition. Explore our collection and
          find your perfect brew.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
