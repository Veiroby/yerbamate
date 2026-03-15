import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { removeFromWishlist } from "./actions";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/profile");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
  });

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

      {items.length === 0 ? (
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
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const p = item.product;
            const image = p.images[0];
            return (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <Link
                  href={`/products/${encodeURIComponent(p.slug)}`}
                  className="flex flex-1 flex-col"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-2">
                    <p className="line-clamp-2 text-base font-medium text-gray-900">{p.name}</p>
                    <p className="mt-auto pt-2 text-base font-semibold text-black">
                      {p.currency} {Number(p.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
                <form action={removeFromWishlist} className="border-t border-gray-100 p-2">
                  <input type="hidden" name="productId" value={p.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Remove from wishlist
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
