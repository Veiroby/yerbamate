"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductFavoriteHeart } from "@/app/components/product-favorite-heart";
import { useWishlist } from "@/lib/wishlist-context";

type Props = {
  productId: string;
  className?: string;
};

export function ProductWishlistHeart({ productId, className = "" }: Props) {
  const router = useRouter();
  const wishlist = useWishlist();
  const isFavorited = wishlist ? wishlist.isInWishlist(productId) : false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!wishlist) return;
    const ok = await wishlist.toggle(productId);
    if (!ok) {
      toast.info("Sign in to save items to your wishlist", {
        action: {
          label: "Sign in",
          onClick: () => router.push("/account/profile"),
        },
      });
    }
  };

  if (!wishlist) {
    return null;
  }

  return (
    <ProductFavoriteHeart
      isFavorited={isFavorited}
      onToggle={handleToggle}
      className={className}
    />
  );
}
