"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  product: {
    name: string;
    image?: { url: string; altText?: string | null } | null;
  } | null;
};

export function CartItem({ id, quantity: initialQuantity, unitPrice, currency, product }: Props) {
  const router = useRouter();
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 aspect-square">
          {product?.image ? (
            <Image
              src={product.image.url}
              alt={product.image.altText ?? product.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate">
            {product?.name ?? "Product"}
          </p>
          <p className="text-xs text-stone-500">
            {currency} {unitPrice.toFixed(2)} each
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-stone-200">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={loading || quantity <= 1}
            className="flex h-8 w-8 items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg transition"
            aria-label="Decrease quantity"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-10 text-center text-sm font-medium text-stone-900">
            {loading ? "..." : quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg transition"
            aria-label="Increase quantity"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="w-20 text-right">
          <p className="text-sm font-medium text-stone-900">
            {currency} {lineTotal.toFixed(2)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center text-stone-400 hover:text-red-600 disabled:opacity-40 transition"
          aria-label="Remove item"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
