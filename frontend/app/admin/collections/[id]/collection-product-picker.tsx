"use client";

import Image from "next/image";
import { useTransition } from "react";
import { addProductToCollection, removeProductFromCollection, reorderCollectionProducts } from "./actions";

type InCollectionItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  position: number;
};

type AvailableProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

type Props = {
  collectionId: string;
  inCollection: InCollectionItem[];
  availableProducts: AvailableProduct[];
};

export function CollectionProductPicker({
  collectionId,
  inCollection,
  availableProducts,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleAdd = (productId: string) => {
    startTransition(() => {
      addProductToCollection(collectionId, productId);
    });
  };

  const handleRemove = (productInCollectionId: string) => {
    startTransition(() => {
      removeProductFromCollection(collectionId, productInCollectionId);
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newOrder = [...inCollection];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newOrder.length) return;
    [newOrder[index], newOrder[swap]] = [newOrder[swap], newOrder[index]];
    const ids = newOrder.map((p) => p.id);
    startTransition(() => {
      reorderCollectionProducts(collectionId, ids);
    });
  };

  return (
    <div className="space-y-6">
      {/* In collection list */}
      <div className="space-y-2">
        {inCollection.length === 0 ? (
          <p className="text-sm text-zinc-500">No products in this collection yet. Add some below.</p>
        ) : (
          <ul className="space-y-2">
            {inCollection.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2"
              >
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0 || isPending}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-40"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, "down")}
                    disabled={index === inCollection.length - 1 || isPending}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-40"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
                {item.imageUrl ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-200" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                  {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="shrink-0 rounded-full border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add product */}
      {availableProducts.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Add product
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAdd(p.id)}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
              >
                {p.imageUrl ? (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                    <Image
                      src={p.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-md bg-zinc-200" />
                )}
                <span className="max-w-[180px] truncate">{p.name}</span>
                <span className="text-zinc-400">+ Add</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
