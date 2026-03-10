import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { error } = await searchParams;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <SiteHeader user={null} />
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="font-serif mb-4 text-2xl font-semibold tracking-tight text-stone-900">
            Sign in or create an account
          </h1>

          {error && (
            <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
              {error === "denied" && "Sign-in was cancelled."}
              {error === "oauth" && "Something went wrong with sign-in. Please try again."}
              {error === "no_code" && "Missing authorization. Please try again."}
              {!["denied", "oauth", "no_code"].includes(error) && "Something went wrong. Please try again."}
            </p>
          )}

          <div className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-stone-900">
                Sign in with
              </h2>
              <div className="grid gap-2">
                <a
                  href="/api/auth/google"
                  className="flex items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </a>
              </div>
            </section>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-stone-500">or</span>
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-stone-900">
                Existing customers
              </h2>
              <form
                action="/api/auth/login"
                method="post"
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-stone-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-stone-600">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                >
                  Sign in
                </button>
              </form>
            </section>

            <section className="space-y-3 border-t border-stone-200 pt-4">
              <h2 className="text-sm font-semibold text-stone-900">
                New customers
              </h2>
              <p className="text-xs text-stone-500">
                Create an account to save your details and view your order
                history. Guest orders with the same email will be linked
                automatically.
              </p>
              <form
                action="/api/auth/register"
                method="post"
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-stone-600">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-stone-600">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-stone-600">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Create account
                </button>
              </form>
            </section>

            <p className="text-xs text-stone-500">
              You can always checkout as a guest from the{" "}
              <Link href="/checkout" className="text-teal-700 underline hover:text-teal-800">
                checkout page
              </Link>
              .
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const ordersCount = await prisma.order.count({
    where: { userId: user.id },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader user={{ isAdmin: user.isAdmin }} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
              Account profile
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Signed in as {user.email}
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-stone-300 px-4 py-1.5 text-xs font-medium text-stone-700 transition hover:border-teal-500 hover:text-teal-700"
            >
              Sign out
            </button>
          </form>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-900">
              Personal details
            </h2>
            <form
              action={async (formData) => {
                "use server";
                const name = formData.get("name")?.toString().trim() || null;
                await prisma.user.update({
                  where: { id: user.id },
                  data: { name },
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-xs font-medium text-stone-600">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name ?? ""}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-stone-600">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-teal-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-700"
              >
                Save changes
              </button>
            </form>
          </section>

          <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-900">
              Orders overview
            </h2>
            <p className="text-sm text-stone-600">
              You have{" "}
              <span className="font-semibold text-stone-900">
                {ordersCount}
              </span>{" "}
              order{ordersCount === 1 ? "" : "s"} linked to this account.
            </p>
            <Link
              href="/account/orders"
              className="inline-flex text-sm font-medium text-teal-700 transition hover:text-teal-800"
            >
              View order history →
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

