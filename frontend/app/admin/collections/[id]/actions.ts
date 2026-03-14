"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addProductToCollection(collectionId: string, productId: string) {
  const max = await prisma.productInCollection.aggregate({
    where: { collectionId },
    _max: { position: true },
  });
  const position = (max._max.position ?? -1) + 1;
  await prisma.productInCollection.create({
    data: { collectionId, productId, position },
  });
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/");
}

export async function removeProductFromCollection(collectionId: string, productInCollectionId: string) {
  await prisma.productInCollection.delete({
    where: { id: productInCollectionId },
  });
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/");
}

export async function reorderCollectionProducts(
  collectionId: string,
  orderedProductInCollectionIds: string[],
) {
  for (let i = 0; i < orderedProductInCollectionIds.length; i++) {
    await prisma.productInCollection.update({
      where: { id: orderedProductInCollectionIds[i] },
      data: { position: i },
    });
  }
  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/");
}
