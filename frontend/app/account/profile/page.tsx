import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { AuthForms } from "../auth-forms";

type Props = { searchParams: Promise<{ error?: string; status?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { error, status } = await searchParams;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
        <SiteHeader user={null} />
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="heading-page mb-4">Sign in or create an account</h1>

          <AuthForms error={error} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const showPasswordResetSuccess = status === "password_reset";

  const ordersCount = await prisma.order.count({
    where: { userId: user.id },
  });

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#283618]">
      <SiteHeader user={{ isAdmin: user.isAdmin }} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        {showPasswordResetSuccess && (
          <div className="mb-6 rounded-xl bg-[#606C38]/15 px-4 py-3 text-sm text-[#283618]">
            <p className="font-medium">Password reset successful</p>
            <p className="mt-1 text-[#606C38]">Your password has been updated and you&apos;re now signed in.</p>
          </div>
        )}

        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="heading-page">
              Account profile
            </h1>
            <p className="mt-1 text-sm text-[#606C38]">
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
                className="rounded-2xl bg-[#344e41] px-4 py-2 text-xs font-medium text-[#dad7cd] transition hover:bg-[#24352b]"
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

