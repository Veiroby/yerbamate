"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translation-context";

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
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 0 || loading) return;

    setLoading(true);
    try {
      if (newQuantity === 0) {
        const res = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
        if (res.ok) {
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
    <div className="relative flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6">
      {/* Delete: top-right on mobile, inline on desktop */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-40 transition sm:static sm:order-last sm:ml-auto"
        aria-label={t("cart.removeItem")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <div className="flex flex-1 items-start gap-4 sm:items-center min-w-0">
        <div className="flex w-24 shrink-0 flex-col gap-2 sm:w-28">
          <div className="relative h-24 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-28">
            {product?.image ? (
              <Image
                src={product.image.url}
                alt={product.image.altText ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 112px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
              </div>
            )}
          </div>
          {bundleLine ? (
            <p className="text-[11px] font-semibold leading-snug text-black sm:text-xs">
              {bundleLine}
            </p>
          ) : null}
        </div>
        <div className="flex-1 min-w-0 pt-1 sm:pt-0">
          <p className="font-semibold text-black truncate">
            {product?.name ?? t("common.product")}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {currency} {unitPrice.toFixed(2)} {t("cart.each")}
          </p>
          <p className="mt-2 text-base font-bold text-black sm:mt-3">
            {currency} {lineTotal.toFixed(2)}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={loading || quantity <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-l-full text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label={t("cart.decreaseQty")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="min-w-[2.25rem] text-center text-sm font-medium text-black">
                {loading ? t("cart.loadingQty") : quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-r-full text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
