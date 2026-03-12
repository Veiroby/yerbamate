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
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(productId, productName, quantity);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    const success = await addToCart(productId, productName, quantity);
    setAddingToCart(false);
    if (success) {
      window.location.href = "/checkout";
    }
  };

  const handleStickyAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(productId, productName, 1);
    setAddingToCart(false);
  };

  return (
    <>
      {/* Main form */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <label
            htmlFor="quantity"
            className="block text-sm font-semibold text-stone-900"
          >
            How many do you want?
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={quantityLeft}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(quantityLeft, parseInt(e.target.value) || 1)))}
            className="w-24 rounded-xl border border-stone-300 px-3 py-2.5 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {quantityLeft < 10 && (
            <p className="text-xs text-stone-500">
              Only {quantityLeft} left in stock
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isLoading}
            className="flex-1 rounded-full border border-teal-600 py-3 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex-1 rounded-full bg-teal-600 py-3 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy now
          </button>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg transition-transform duration-300 md:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-stone-900">
              {currency} {price.toFixed(2)}
            </p>
            <p className="text-xs text-stone-500">{quantityLeft} in stock</p>
          </div>
          <button
            type="button"
            onClick={handleStickyAddToCart}
            disabled={addingToCart || isLoading}
            className="flex-1 max-w-[200px] rounded-full bg-teal-600 py-3 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </>
  );
}
