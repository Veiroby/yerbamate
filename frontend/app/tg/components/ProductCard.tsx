"use client";

import Link from "next/link";
import { formatMoney, productUnitPrice } from "../lib/price";
import type { TgProduct } from "../lib/types";

export function ProductCard({ product }: { product: TgProduct }) {
  const image = product.images?.[0];
  const price = productUnitPrice(product);

  return (
    <Link
      href={`/tg/product/${product.id}`}
      className="flex gap-3 rounded-2xl border border-black/5 bg-white/70 p-3 shadow-sm"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--cornsilk,#FEFAE0)]">
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText || product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted,#606C38)]">
            Mate
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--black-forest,#283618)]">
          {product.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-black/50">
          {product.descriptionLv || product.descriptionEn || product.description || ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--copper,#BC6C25)]">
          {formatMoney(price, product.currency || "EUR")}
        </p>
      </div>
    </Link>
  );
}
