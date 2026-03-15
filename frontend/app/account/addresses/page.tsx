import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function AddressBookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/profile");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          Address Book
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your saved delivery addresses.
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <p className="text-sm text-gray-600">
          Saved addresses are coming soon. Your shipping address is collected at checkout for each order.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-black underline hover:no-underline"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
