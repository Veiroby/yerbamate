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
  textColor = "text-[#283618]",
  buttonClass = "bg-[#BC6C25] text-[#FEFAE0] hover:bg-[#a55a1f]",
  outlineClass = "border-2 border-[#606C38] text-[#606C38] hover:bg-[#606C38]/10",
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
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={busy}
        className={`rounded px-3 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm ${outlineClass}`}
      >
        {busy ? "…" : "Add to cart"}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={busy}
        className={`rounded px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm ${buttonClass}`}
      >
        Buy now
      </button>
    </div>
  );
}
