"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ProductFavoriteHeart } from "@/app/components/product-favorite-heart";
import { ProductWishlistHeart } from "@/app/components/product-wishlist-heart";
import { useTranslation } from "@/lib/translation-context";
import { useCart } from "@/lib/cart-context";
import type { Locale } from "@/lib/locale";

export type CarouselProduct = {
  title: string;
  price: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
  weight?: string | null;
  productId?: string;
  quantityLeft?: number;
  /** "in_stock" | "get_in_5_7_days" for display */
  stockStatus?: string;
  stockLocation?: string | null;
};

type Props = {
  title?: string;
  titleKey?: string;
  products: CarouselProduct[];
  /** No top padding/margin — e.g. first carousel directly under hero */
  compactTop?: boolean;
};

function CarouselSectionCard({ p }: { p: CarouselProduct }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const { t } = useTranslation();
  const { addToCart, isLoading: cartLoading } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const locale: Locale = p.href.startsWith("/en") ? "en" : "lv";
  const qty = p.quantityLeft ?? 0;
  const location = (p.stockLocation ?? "instock").toLowerCase();
  const isWarehouse = location === "warehouse";
  /**
   * Only "instock" should depend on on-hand quantity.
   * Anything else (e.g. preorder/backorder/unknown) must remain orderable.
   */
  const usesOnHandQty = location === "instock";
  const soldOut = usesOnHandQty && qty <= 0;
  const canAddToCart = Boolean(p.productId) && !soldOut;
  /** Same rules as product page stock chip (in stock vs preorder); sold out → muted label */
  const stockBadge: "sold_out" | "in_stock" | "preorder" = soldOut
    ? "sold_out"
    : isWarehouse || !usesOnHandQty
      ? "preorder"
      : "in_stock";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.productId || soldOut) return;
    setAddingToCart(true);
    await addToCart(p.productId, p.title, 1);
    setAddingToCart(false);
  };

  return (
    <div
      className={`group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md sm:w-[260px] md:w-[300px] ${
        soldOut ? "opacity-70" : ""
      }`}
    >
      <Link
        href={soldOut ? "#" : p.href}
        className={`flex min-h-0 flex-1 flex-col ${soldOut ? "pointer-events-none" : ""}`}
        aria-label={soldOut ? undefined : `${t("product.viewProduct")}: ${p.title}`}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-gray-50">
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.imageAlt || p.title}
              fill
              className="object-contain transition group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 220px, (max-width: 768px) 260px, 300px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                {t("product.soldOut")}
              </span>
            </div>
          )}
          {!soldOut &&
            (p.productId ? (
              <ProductWishlistHeart productId={p.productId} className="absolute top-2 right-2 z-10" />
            ) : (
              <ProductFavoriteHeart
                isFavorited={isFavorited}
                onToggle={() => setIsFavorited((v) => !v)}
                className="absolute top-2 right-2 z-10"
              />
            ))}
        </div>
        <div className="flex flex-1 flex-col p-2">
          <p className="line-clamp-2 text-base font-medium text-gray-900 sm:text-lg">{p.title}</p>
          {p.weight ? (
            <p className="mt-1 text-sm text-gray-500">{p.weight}</p>
          ) : null}
          <div className="mt-auto flex items-end justify-between pt-2">
            <p className="text-base font-semibold text-black sm:text-lg">{p.price}</p>
            <div className="flex items-center gap-1 text-xs font-semibold">
              {stockBadge === "in_stock" ? (
                <span className="text-emerald-600">
                  {t("product.inStock")}
                </span>
              ) : stockBadge === "sold_out" ? (
                <span className="text-gray-500">{t("product.soldOut")}</span>
              ) : (
                <span className="flex items-center gap-1 text-black">
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
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={canAddToCart ? handleAddToCart : undefined}
          disabled={!canAddToCart || addingToCart || cartLoading}
          className="w-full rounded-xl bg-black py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {soldOut
            ? t("product.soldOut")
            : addingToCart
              ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("cart.adding")}
                </span>
              )
              : t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}

export function ProductCarouselSection({ title, titleKey, products, compactTop }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const displayTitle = titleKey ? t(titleKey) : (title ?? "");
  const locale: Locale = pathname?.startsWith("/en") ? "en" : "lv";

  if (products.length === 0) return null;

  const sectionId = displayTitle.replace(/\s/g, "-").toLowerCase();

  return (
    <section
      className={`bg-white px-4 ${compactTop ? "pt-0 mt-0 pb-12 sm:pb-16" : "py-12 sm:py-16"}`}
      aria-labelledby={`carousel-${sectionId}`}
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id={`carousel-${sectionId}`}
          className="mb-8 text-center text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl"
        >
          {displayTitle}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-thin sm:gap-8">
          {products.map((p) => (
            <CarouselSectionCard key={p.href} p={p} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href={`/${locale}/products`}
            className="rounded-full border-2 border-gray-900 px-8 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
          >
            {t("home.viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
