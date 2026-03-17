"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useTranslation } from "@/lib/translation-context";
import { ProductWishlistHeart } from "@/app/components/product-wishlist-heart";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  quantityLeft: number;
  /** "in_stock" | "get_in_5_7_days" for display */
  stockStatus?: string;
  stockLocation?: string | null;
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
  const pathname = usePathname();
  const { t } = useTranslation();
  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const locale = localePrefix === "/lv" ? "lv" : "en";
  const productHref = `${localePrefix}/products/${encodeURIComponent(product.slug)}`;
  const stockStatus =
    product.stockLocation === "warehouse"
      ? "get_in_5_7_days"
      : "in_stock";
  const soldOut = product.stockLocation !== "warehouse" && product.quantityLeft <= 0;
  const { addToCart, isLoading } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(product.id, product.name, 1);
    setAddingToCart(false);
  };

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition duration-200 hover:opacity-95 hover:shadow-md ${
        soldOut ? "opacity-70" : "hover:-translate-y-0.5"
      }`}
    >
      <Link
        href={soldOut ? "#" : productHref}
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
              <span className="text-xs font-medium text-gray-500">{t("product.productImage")}</span>
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white">
                {t("product.soldOut")}
              </span>
            </div>
          )}
          {!soldOut && (
            <ProductWishlistHeart
              productId={product.id}
              className="absolute top-2 right-2 z-10"
            />
          )}
        </div>

        {/* Left-aligned: title, weight, optional description */}
        <div className="flex flex-1 min-h-0 flex-col p-2 text-left">
          <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 transition group-hover:text-black">
            {product.name}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            {product.weight ?? "—"}
          </p>
          {showDescription && product.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-gray-500">
              {product.description}
            </p>
          ) : null}
          <div className="mt-auto flex items-end justify-between pt-2">
            <p className="text-lg font-semibold text-black">
              {product.currency} {product.price.toFixed(2)}
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold">
              {stockStatus === "in_stock" ? (
                <span className="text-emerald-600">
                  {t("product.inStock")}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-black">
                  {/* Simple shipping icon */}
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7h11v8H3V7zm11 3h3.5L21 12.5V15h-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
                    <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" />
                  </svg>
                  <span>
                    {locale === "lv" ? "5–7 dienas" : t("product.preOrder")}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Add to cart button */}
      {!soldOut && (
        <div className="mt-4 px-4 pb-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isLoading}
            className="w-full rounded-xl bg-black py-3.5 text-base font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("cart.adding")}
              </span>
            ) : (
              t("product.addToCart")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
