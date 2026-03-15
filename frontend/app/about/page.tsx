import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default async function AboutPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-black sm:text-4xl">
          About us
        </h1>
        <div className="prose prose-neutral max-w-none">
          <p className="leading-relaxed text-neutral-600">
            I am Roberts, a professional footballer based in Latvia. In 2016, I
            discovered yerba mate and instantly fell in love with it. The drink
            provided a clear edge in my professional sports career, enhancing my
            focus during training sessions, improving my mood, and delivering
            sustained energy without the downsides of coffee. Eager to share
            this benefit, I connected with producers in Argentina to import
            authentic yerba mate to Latvia, making it available to all. Our
            initial launch of premium mate gourds faced challenges, as the
            tradition was unfamiliar to most. From that experience, we committed
            to educating the market through tastings and workshops, while
            offering a wide selection of products tailored for beginners and
            experienced mate enthusiasts alike. Today, we&apos;re fostering a
            growing community around this timeless ritual.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
