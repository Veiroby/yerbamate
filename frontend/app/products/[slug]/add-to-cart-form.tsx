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
      {/* Main form – Figma-style: quantity + Add to cart row */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="quantity"
              className="text-[10px] font-medium uppercase tracking-wider text-[#606C38]"
            >
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={quantityLeft}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(quantityLeft, parseInt(e.target.value) || 1)))}
              className="h-10 w-14 rounded border-2 border-[#606C38]/30 bg-[#FEFAE0] px-2 text-center text-sm font-semibold text-[#283618] focus:border-[#BC6C25] focus:outline-none focus:ring-1 focus:ring-[#BC6C25]"
            />
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isLoading}
            className="flex-1 min-w-[180px] rounded-full bg-[#BC6C25] py-3 text-xs font-semibold uppercase tracking-wide text-[#FEFAE0] transition hover:bg-[#a55a1f] disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="rounded-full border-2 border-[#606C38] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#606C38] transition hover:bg-[#606C38]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buy now
          </button>
        </div>
        {quantityLeft < 10 && (
          <p className="text-xs text-[#606C38]">
            Only {quantityLeft} left in stock
          </p>
        )}
      </div>

      {/* Mobile sticky bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-[#606C38]/20 bg-[#FEFAE0]/95 px-4 py-3 shadow-lg backdrop-blur-md transition-transform duration-300 md:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-[#283618]">
              {currency} {price.toFixed(2)}
            </p>
            <p className="text-xs text-[#606C38]">{quantityLeft} in stock</p>
          </div>
          <button
            type="button"
            onClick={handleStickyAddToCart}
            disabled={addingToCart || isLoading}
            className="max-w-[200px] flex-1 rounded bg-[#BC6C25] py-3 text-sm font-semibold uppercase tracking-wide text-[#FEFAE0] transition hover:bg-[#a55a1f] disabled:opacity-50 disabled:cursor-not-allowed"
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
