"use client";

import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/locale-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </LocaleProvider>
  );
}
