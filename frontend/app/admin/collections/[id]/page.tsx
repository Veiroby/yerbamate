import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CollectionProductPicker } from "./collection-product-picker";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCollectionEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();

  const { id } = await params;
  const [collection, allProducts] = await Promise.all([
    prisma.collection.findUnique({
      where: { id },
      include: {
        products: {
          orderBy: { position: "asc" },
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
  ]);

  if (!collection) notFound();

  const productIdsInCollection = new Set(collection.products.map((p) => p.productId));
  const productsNotInCollection = allProducts.filter((p) => !productIdsInCollection.has(p.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/collections"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Collections
        </Link>
        <h2 className="text-lg font-semibold text-zinc-900">
          {collection.name}
        </h2>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Products in this collection ({collection.products.length})
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          Order determines display order on the main page carousel. Remove or add products below.
        </p>
        <CollectionProductPicker
          collectionId={collection.id}
          inCollection={collection.products.map((pc) => ({
            id: pc.id,
            productId: pc.product.id,
            name: pc.product.name,
            slug: pc.product.slug,
            imageUrl: pc.product.images[0]?.url ?? null,
            position: pc.position,
          }))}
          availableProducts={productsNotInCollection.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            imageUrl: p.images[0]?.url ?? null,
          }))}
        />
      </section>
    </div>
  );
}
