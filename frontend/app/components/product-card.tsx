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
      className={`group flex flex-col overflow-hidden rounded-lg bg-transparent transition duration-200 hover:opacity-95 ${
        soldOut ? "opacity-70" : "hover:-translate-y-0.5"
      }`}
    >
      <Link
        href={soldOut ? "#" : `/products/${encodeURIComponent(product.slug)}`}
        className={`block flex-1 min-h-0 ${soldOut ? "pointer-events-none" : "cursor-pointer"}`}
        aria-label={`View ${product.name}`}
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-transparent">
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
        <div className="flex flex-1 flex-col px-4 pt-1 pb-3">
          {(product.brand || product.origin) && (
            <div className="mb-1 flex flex-wrap gap-1">
              {product.brand && (
                <span className="rounded bg-[#606C38]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#606C38]">
                  {product.brand}
                </span>
              )}
              {product.origin && (
                <span className="rounded bg-[#DDA15E]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#BC6C25]">
                  {product.origin}
                </span>
              )}
            </div>
          )}
          <h2 className="mb-1 line-clamp-2 text-sm font-medium text-[#283618] transition group-hover:text-[#BC6C25]">
            {product.name}
          </h2>
          {product.weight ? (
            <p className="mb-1 text-xs text-[#606C38]">{product.weight}</p>
          ) : null}
          {showDescription && product.description ? (
            <p className="line-clamp-2 text-xs text-[#606C38]">
              {product.description}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <p className="text-sm font-semibold text-[#283618]">
              {product.currency} {product.price.toFixed(2)}
            </p>
            {!soldOut && (
              <span className="text-xs text-gray-500">
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
            className="flex-1 rounded border-2 border-[#606C38] py-2.5 text-xs font-semibold uppercase tracking-wide text-[#606C38] transition hover:bg-[#606C38]/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex-1 rounded bg-[#BC6C25] py-2.5 text-xs font-semibold uppercase tracking-wide text-[#FEFAE0] transition hover:bg-[#a55a1f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
