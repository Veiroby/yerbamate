"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";
import { useCart } from "@/lib/cart-context";

type Props = {
  id: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  bundleLine?: string | null;
  product: {
    name: string;
    image?: { url: string; altText?: string | null } | null;
  } | null;
};

export function CartItem({ id, quantity: initialQuantity, unitPrice, currency, bundleLine, product }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { refreshCart } = useCart();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 0 || loading) return;

    setLoading(true);
    try {
      if (newQuantity === 0) {
        const res = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
        if (res.ok) {
          await refreshCart();
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/cart/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity }),
        });
        if (res.ok) {
          setQuantity(newQuantity);
          await refreshCart();
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => updateQuantity(0);
  const handleDecrement = () => updateQuantity(quantity - 1);
  const handleIncrement = () => updateQuantity(quantity + 1);

  const lineTotal = unitPrice * quantity;

  return (
    <div className="relative flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:gap-6 lg:rounded-2xl">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="hidden lg:order-last lg:ml-auto lg:flex lg:h-9 lg:w-9 lg:items-center lg:justify-center lg:self-center lg:rounded-full lg:text-gray-400 lg:hover:bg-gray-100 lg:hover:text-red-600 disabled:opacity-40"
        aria-label={t("cart.removeItem")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 items-start gap-3 lg:items-center lg:pr-0">
        <div className="flex w-20 shrink-0 flex-col gap-2 sm:w-24 lg:w-28">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
            {product?.image ? (
              <Image
                src={product.image.url}
                alt={product.image.altText ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
              </div>
            )}
          </div>
          {bundleLine ? (
            <p className="text-[11px] font-semibold leading-snug text-black lg:text-xs">{bundleLine}</p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 pt-0 lg:pt-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug text-black line-clamp-2 lg:truncate lg:leading-normal">
              {product?.name ?? t("common.product")}
            </p>
            <p className="shrink-0 text-base font-bold tabular-nums text-black">
              {currency} {lineTotal.toFixed(2)}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {currency} {unitPrice.toFixed(2)} {t("cart.each")}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-[#F2F2F7] px-1 py-1 lg:border lg:border-gray-200 lg:bg-white">
              <button
                type="button"
                onClick={quantity <= 1 ? handleDelete : handleDecrement}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-200/80 disabled:opacity-40 lg:h-9 lg:w-9 lg:rounded-l-full lg:rounded-r-none lg:hover:bg-gray-50"
                aria-label={quantity <= 1 ? t("cart.removeItem") : t("cart.decreaseQty")}
              >
                {quantity <= 1 ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
              </button>
              <span className="min-w-[2rem] px-2 text-center text-sm font-semibold tabular-nums text-black">
                {loading ? "…" : quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-200/80 disabled:opacity-40 lg:h-9 lg:w-9 lg:rounded-r-full lg:rounded-l-none lg:hover:bg-gray-50"
                aria-label={t("cart.increaseQty")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
