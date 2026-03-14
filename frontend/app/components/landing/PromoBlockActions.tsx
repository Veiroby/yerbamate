"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

type Props = {
  productId: string;
  productName: string;
  productHref: string;
  textColor?: string;
  buttonClass?: string;
  outlineClass?: string;
};

export function PromoBlockActions({
  productId,
  productName,
  productHref,
  textColor = "text-gray-900",
  buttonClass = "bg-gray-900 text-white hover:bg-gray-800",
  outlineClass = "border-2 border-gray-900 text-gray-900 hover:bg-gray-100",
}: Props) {
  const router = useRouter();
  const { addToCart, isLoading } = useCart();
  const [adding, setAdding] = useState(false);
  const busy = adding || isLoading;

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(productId, productName, 1);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    setAdding(true);
    const ok = await addToCart(productId, productName, 1);
    setAdding(false);
    if (ok) router.push("/checkout");
  };

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={busy}
        className={`rounded px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition disabled:opacity-50 ${outlineClass}`}
      >
        {busy ? "…" : "Add to cart"}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={busy}
        className={`rounded px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition disabled:opacity-50 ${buttonClass}`}
      >
        Buy now
      </button>
    </div>
  );
}
