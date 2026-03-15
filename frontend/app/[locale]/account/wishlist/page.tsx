import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { removeFromWishlist } from "@/app/account/wishlist/actions";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/account/profile`);

  const [items, translations] = await Promise.all([
    prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
    }),
    getTranslations(locale),
  ]);
  const t = createT(translations);
  const prefix = `/${locale}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          {t("account.myWishlist")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("account.wishlistDescription")}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-gray-600">
            {t("account.wishlistEmpty")}
          </p>
          <Link
            href={`${prefix}/products`}
            className="mt-4 inline-block text-sm font-medium text-black underline hover:no-underline"
          >
            {t("account.browseProducts")}
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
                  href={`${prefix}/products/${encodeURIComponent(p.slug)}`}
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
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-semibold text-black">{p.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {p.currency} {Number(p.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
                <div className="border-t border-gray-100 p-4">
                  <form action={removeFromWishlist}>
                    <input type="hidden" name="productId" value={p.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      {t("account.removeFromWishlist")}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
