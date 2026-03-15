import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/profile");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          My Wishlist
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Products you’ve saved to your wishlist.
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <p className="text-sm text-gray-600">
          Your wishlist is empty. Use the heart on product pages to add items.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-black underline hover:no-underline"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
