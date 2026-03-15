"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type WishlistContextValue = {
  productIds: Set<string>;
  isInWishlist: (productId: string) => boolean;
  add: (productId: string) => Promise<boolean>;
  remove: (productId: string) => Promise<boolean>;
  toggle: (productId: string) => Promise<boolean>;
  isLoading: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data: { productIds?: string[] }) => {
        if (!cancelled && Array.isArray(data.productIds)) {
          setProductIds(new Set(data.productIds));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (productId: string) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) return false;
    if (!res.ok) return false;
    setProductIds((prev) => new Set(prev).add(productId));
    return true;
  }, []);

  const remove = useCallback(async (productId: string) => {
    const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    if (res.status === 401) return false;
    if (!res.ok) return false;
    setProductIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    return true;
  }, []);

  const toggle = useCallback(
    async (productId: string) => {
      const inList = productIds.has(productId);
      if (inList) return remove(productId);
      return add(productId);
    },
    [productIds, add, remove],
  );

  const isInWishlist = useCallback(
    (id: string) => productIds.has(id),
    [productIds],
  );

  const value: WishlistContextValue = {
    productIds,
    isInWishlist,
    add,
    remove,
    toggle,
    isLoading: isLoading,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  return ctx;
}
