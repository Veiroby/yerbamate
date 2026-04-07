"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocalePrefixForRedirect } from "@/lib/i18n";

export async function removeFromWishlist(formData: FormData) {
  const user = await getCurrentUser();
  const prefix = await getLocalePrefixForRedirect();
  if (!user) redirect(prefix + "/account/profile");
  const productId = formData.get("productId")?.toString()?.trim();
  if (!productId) return;
  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });
  revalidatePath(prefix + "/account/wishlist");
  redirect(prefix + "/account/wishlist");
}
