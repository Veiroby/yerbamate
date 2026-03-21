"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { AddedToCartToast } from "@/app/components/added-to-cart-toast";
import { getAddToCartToastCopy } from "@/lib/cart-toast-copy";

type CartContextType = {
  itemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, productName: string, quantity?: number) => Promise<boolean>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children, initialCount = 0 }: { children: ReactNode; initialCount?: number }) {
  const [itemCount, setItemCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        const count = data.cart?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0;
        setItemCount(count);
      }
    } catch {
      // Silently fail - cart will update on next page load
    }
  }, []);

  const addToCart = useCallback(async (productId: string, productName: string, quantity = 1): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("quantity", quantity.toString());

      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const { addError } = getAddToCartToastCopy();
        toast.error(typeof data.error === "string" && data.error.trim() ? data.error : addError);
        return false;
      }

      const data = await res.json();
      setItemCount(data.cartItemCount ?? itemCount + quantity);

      const { title, viewCart, cartHref } = getAddToCartToastCopy();
      toast.custom(
        (id) => (
          <AddedToCartToast
            toastId={id}
            title={title}
            productName={productName}
            viewCartLabel={viewCart}
            cartHref={cartHref}
          />
        ),
        {
          duration: 5000,
          unstyled: true,
          className: "!bg-transparent !border-0 !p-0 !shadow-none",
        },
      );

      return true;
    } catch {
      const { addError } = getAddToCartToastCopy();
      toast.error(addError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [itemCount]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, isLoading, addToCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
