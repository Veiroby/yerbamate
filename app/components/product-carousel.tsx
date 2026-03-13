"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  quantityLeft: number;
};

function CarouselAddToCartButtons({ productId, productName }: { productId: string; productName: string }) {
  const { addToCart, isLoading } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(productId, productName, 1);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    setAdding(true);
    const success = await addToCart(productId, productName, 1);
    setAdding(false);
    if (success) {
      window.location.href = "/checkout";
    }
  };

  return (
    <div className="flex gap-2 px-4 pb-4">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={adding || isLoading}
        className="flex-1 rounded-2xl border border-[#344e41] py-2 text-xs font-medium text-[#344e41] transition hover:bg-[#d1cec4] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {adding ? (
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
        disabled={adding || isLoading}
        className="flex-1 rounded-2xl bg-[#344e41] py-2 text-xs font-medium text-[#dad7cd] transition hover:bg-[#24352b] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Buy now
      </button>
    </div>
  );
}

export function ProductCarousel({ products }: { products: ProductCard[] }) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No products available yet. Add some from the admin panel.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth md:gap-6">
        {products.map((product) => {
          const soldOut = product.quantityLeft <= 0;
          return (
            <div
              key={product.id}
              className={`group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-200 hover:shadow-md md:w-[300px] ${
                soldOut ? "opacity-70" : ""
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
                      className="object-cover"
                      sizes="300px"
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
                <div className="px-4 py-2">
                  <h3 className="line-clamp-2 text-sm font-medium text-stone-900 group-hover:text-teal-700 transition">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between gap-2">
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
                <CarouselAddToCartButtons productId={product.id} productName={product.name} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
