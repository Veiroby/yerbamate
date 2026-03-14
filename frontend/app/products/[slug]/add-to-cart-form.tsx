"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";

type AddToCartFormProps = {
  productId: string;
  productName: string;
  quantityLeft: number;
  price: number;
  currency: string;
};

export function AddToCartForm({ productId, productName, quantityLeft, price, currency }: AddToCartFormProps) {
  const { addToCart, isLoading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const clampedQty = Math.max(1, Math.min(quantityLeft, quantity));

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(productId, productName, clampedQty);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    const success = await addToCart(productId, productName, clampedQty);
    setAddingToCart(false);
    if (success) window.location.href = "/checkout";
  };

  const handleStickyAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(productId, productName, 1);
    setAddingToCart(false);
  };

  return (
    <>
      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Quantity</p>
          <div className="flex items-center gap-0 rounded-md border border-gray-300 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((n) => Math.max(1, n - 1))}
              disabled={quantity <= 1}
              className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <span className="text-lg font-medium">−</span>
            </button>
            <span className="flex h-11 min-w-[3rem] items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900">
              {clampedQty}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((n) => Math.min(quantityLeft, n + 1))}
              disabled={quantity >= quantityLeft}
              className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <span className="text-lg font-medium">+</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isLoading}
            className="flex-1 rounded-md bg-black py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
            className="rounded-md border-2 border-gray-900 py-3.5 px-6 text-sm font-semibold uppercase tracking-wide text-gray-900 transition hover:bg-gray-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy now
          </button>
        </div>
        {quantityLeft < 10 && (
          <p className="text-xs text-gray-500">Only {quantityLeft} left in stock</p>
        )}
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md transition-transform duration-300 md:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">{currency} {price.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{quantityLeft} in stock</p>
          </div>
          <button
            type="button"
            onClick={handleStickyAddToCart}
            disabled={addingToCart || isLoading}
            className="max-w-[200px] flex-1 rounded-md bg-black py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? "…" : "Add to cart"}
          </button>
        </div>
      </div>
    </>
  );
}
