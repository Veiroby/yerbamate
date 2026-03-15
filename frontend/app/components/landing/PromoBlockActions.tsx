"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useTranslation } from "@/lib/translation-context";
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
  const pathname = usePathname();
  const { t } = useTranslation();
  const { addToCart, isLoading } = useCart();
  const [adding, setAdding] = useState(false);
  const busy = adding || isLoading;
  const checkoutPrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(productId, productName, 1);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    setAdding(true);
    const ok = await addToCart(productId, productName, 1);
    setAdding(false);
    if (ok) router.push(checkoutPrefix ? `${checkoutPrefix}/checkout` : "/checkout");
  };

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={busy}
        className={`h-11 w-full min-h-[44px] rounded px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50 sm:h-auto sm:min-h-0 sm:w-auto sm:px-4 sm:py-2.5 sm:text-sm ${outlineClass}`}
      >
        {busy ? "…" : t("home.addToCart")}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={busy}
        className={`h-11 w-full min-h-[44px] rounded px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition disabled:opacity-50 sm:h-auto sm:min-h-0 sm:w-auto sm:px-4 sm:py-2.5 sm:text-sm ${buttonClass}`}
      >
        {t("home.buyNow")}
      </button>
    </div>
  );
}
