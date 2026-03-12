"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

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
  brand?: string | null;
  origin?: string | null;
};

type Props = {
  product: ProductCardData;
  showDescription?: boolean;
};

export function ProductCard({ product, showDescription }: Props) {
  const soldOut = product.quantityLeft <= 0;
  const { addToCart, isLoading } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(product.id, product.name, 1);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    const success = await addToCart(product.id, product.name, 1);
    setAddingToCart(false);
    if (success) {
      window.location.href = "/checkout";
    }
  };

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
          {(product.brand || product.origin) && (
            <div className="mb-1 flex flex-wrap gap-1">
              {product.brand && (
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                  {product.brand}
                </span>
              )}
              {product.origin && (
                <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
                  {product.origin}
                </span>
              )}
            </div>
          )}
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
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isLoading}
            className="flex-1 rounded-2xl border border-teal-600 py-2.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-1">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </span>
            ) : (
              "Add to cart"
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={addingToCart || isLoading}
            className="flex-1 rounded-2xl bg-teal-600 py-2.5 text-xs font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
