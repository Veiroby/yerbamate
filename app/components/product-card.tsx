import Link from "next/link";
import Image from "next/image";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  quantityLeft: number;
  description?: string | null;
};

type Props = {
  product: ProductCardData;
  showDescription?: boolean;
};

export function ProductCard({ product, showDescription }: Props) {
  const soldOut = product.quantityLeft <= 0;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-200 hover:shadow-md ${
        soldOut ? "opacity-70" : "hover:-translate-y-0.5"
      }`}
    >
      <Link
        href={soldOut ? "#" : `/products/${encodeURIComponent(product.slug)}`}
        className={`block flex-1 min-h-0 ${soldOut ? "pointer-events-none" : "cursor-pointer"}`}
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-stone-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              className="object-cover transition duration-200 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              No image
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/50">
              <span className="rounded-full bg-stone-800 px-4 py-2 text-sm font-semibold text-white">
                Sold out
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-4 py-3">
          <h2 className="mb-1 line-clamp-2 text-sm font-medium text-stone-900 group-hover:text-teal-700 transition">
            {product.name}
          </h2>
          {showDescription && product.description ? (
            <p className="line-clamp-2 text-xs text-stone-500">
              {product.description}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <p className="text-sm font-semibold text-stone-900">
              {product.currency} {product.price.toFixed(2)}
            </p>
            {!soldOut && (
              <span className="text-xs text-stone-500">
                {product.quantityLeft} left
              </span>
            )}
          </div>
        </div>
      </Link>
      {!soldOut && (
        <div className="flex gap-2 px-4 pb-4">
          <form action="/api/cart/items" method="post" className="flex-1">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button
              type="submit"
              className="w-full rounded-2xl border border-teal-600 py-2.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50"
            >
              Add to cart
            </button>
          </form>
          <form
            action="/api/cart/items?redirect=/checkout"
            method="post"
            className="flex-1"
          >
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button
              type="submit"
              className="w-full rounded-2xl bg-teal-600 py-2.5 text-xs font-medium text-white transition hover:bg-teal-700"
            >
              Buy now
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
