import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthForms } from "../auth-forms";

type Props = { searchParams: Promise<{ error?: string; status?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { error, status } = await searchParams;

  if (!user) {
    return (
      <>
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-black">
          Sign in or create an account
        </h1>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <AuthForms error={error} />
        </div>
      </>
    );
  }

  const showPasswordResetSuccess = status === "password_reset";

  const ordersCount = await prisma.order.count({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      {showPasswordResetSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">Password reset successful</p>
          <p className="mt-1 text-green-700">
            Your password has been updated and you&apos;re now signed in.
          </p>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          Account Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Signed in as {user.email}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-black">Account Information</h2>
          <p className="mt-2 text-sm text-gray-600">
            {user.name ? (
              <>Name: <span className="font-medium text-black">{user.name}</span></>
            ) : (
              "Add your name in Account Information."
            )}
          </p>
          <Link
            href="/account/information"
            className="mt-3 inline-block text-sm font-medium text-black underline hover:no-underline"
          >
            Edit details →
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-black">Orders overview</h2>
          <p className="mt-2 text-sm text-gray-600">
            You have{" "}
            <span className="font-semibold text-black">{ordersCount}</span>{" "}
            order{ordersCount === 1 ? "" : "s"} linked to this account.
          </p>
          <Link
            href="/account/orders"
            className="mt-3 inline-block text-sm font-medium text-black underline hover:no-underline"
          >
            View order history →
          </Link>
        </section>
      </div>
    </div>
  );
}
