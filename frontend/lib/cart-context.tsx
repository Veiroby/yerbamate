"use client";

import type { CSSProperties } from "react";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";

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
        toast.error(data.error || "Failed to add item to cart");
        return false;
      }

      const data = await res.json();
      setItemCount(data.cartItemCount ?? itemCount + quantity);

      toast.success("Added to cart", {
        description: productName,
        style: { ["--normal-text" as any]: "#000000" } as CSSProperties,
        classNames: {
          title: "!text-black",
          description: "!text-black",
          actionButton: "!text-black",
        },
        action: {
          label: "View Cart",
          onClick: () => window.location.href = "/cart",
          actionButtonStyle: { color: "#000000" },
        },
      });

      return true;
    } catch {
      toast.error("Failed to add item to cart");
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
