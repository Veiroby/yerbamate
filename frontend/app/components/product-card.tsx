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
  weight?: string | null;
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

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl bg-transparent transition duration-200 hover:opacity-95 ${
        soldOut ? "opacity-70" : "hover:-translate-y-0.5"
      }`}
    >
      <Link
        href={soldOut ? "#" : `/products/${encodeURIComponent(product.slug)}`}
        className={`block flex-1 min-h-0 ${soldOut ? "pointer-events-none" : "cursor-pointer"}`}
        aria-label={`View ${product.name}`}
      >
        {/* Centered product image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-transparent">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              className="object-contain transition duration-200 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
              style={
                (product as any).focalX != null &&
                (product as any).focalY != null
                  ? {
                      objectPosition: `${Math.round(
                        (product as any).focalX * 100,
                      )}% ${Math.round(
                        (product as any).focalY * 100,
                      )}%`,
                      transform:
                        typeof (product as any).zoom === "number" &&
                        (product as any).zoom !== 1
                          ? `scale(${(product as any).zoom})`
                          : undefined,
                    }
                  : {
                      transform:
                        typeof (product as any).zoom === "number" &&
                        (product as any).zoom !== 1
                          ? `scale(${(product as any).zoom})`
                          : undefined,
                    }
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#606C38]/50">
              <span className="text-xs font-medium text-[#606C38]/60">Product image</span>
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#283618]/50">
              <span className="rounded-full bg-[#283618] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#FEFAE0]">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* Centered content: name, then weight | price row */}
        <div className="flex flex-col items-center px-4 pt-6 text-center">
          <h2 className="line-clamp-2 text-lg font-semibold text-[#283618] transition group-hover:text-[#BC6C25]">
            {product.name}
          </h2>
          <div className="mt-3 flex w-full items-center justify-between gap-4 px-0 text-base font-medium text-[#283618]">
            <span className="text-[#606C38]">{product.weight ?? "—"}</span>
            <span className="font-semibold">
              {product.currency} {product.price.toFixed(2)}
            </span>
          </div>
          {showDescription && product.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-[#606C38]">
              {product.description}
            </p>
          ) : null}
        </div>
      </Link>

      {/* Single centered Add to cart button */}
      {!soldOut && (
        <div className="mt-4 px-4 pb-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isLoading}
            className="w-full rounded-xl bg-[#E9C46A] py-3.5 text-base font-bold text-[#283618] transition hover:bg-[#D4B35A] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </span>
            ) : (
              "Add to cart"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
