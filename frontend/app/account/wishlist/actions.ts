"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function removeFromWishlist(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/profile");
  const productId = formData.get("productId")?.toString()?.trim();
  if (!productId) return;
  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });
  revalidatePath("/account/wishlist");
  redirect("/account/wishlist");
}
