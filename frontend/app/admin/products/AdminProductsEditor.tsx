"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { bulkUpdateProducts, deleteProductAction, type BulkProductUpdate } from "./actions";
import { DeleteProductButton } from "./delete-product-button";

type Category = { id: string; name: string };

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  price: number;
  weight: string | null;
  barcode: string | null;
  active: boolean;
  categoryId: string | null;
  category?: { name: string } | null;
  stockLocation: "instock" | "warehouse" | null;
  images: { url: string; altText: string | null }[];
  variants: { inventoryItems: { quantity: number }[] }[];
};

type DirtyMap = Record<string, Partial<BulkProductUpdate>>;

const DIRTY_KEY = "yerbatea_admin_products_dirty_v1";

function totalStock(variants: { inventoryItems: { quantity: number }[] }[]): number {
  return variants.reduce(
    (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );
}

function coerceNumber(value: string): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function AdminProductsEditor({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, startTransition] = useTransition();

  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const debounceRef = useRef<number | null>(null);

  const [dirty, setDirty] = useState<DirtyMap>({});

  // Load persisted dirty edits for this tab/session.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DIRTY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DirtyMap;
      if (parsed && typeof parsed === "object") setDirty(parsed);
    } catch {
      // ignore
    }
  }, []);

  // Persist dirty edits.
  useEffect(() => {
    try {
      sessionStorage.setItem(DIRTY_KEY, JSON.stringify(dirty));
    } catch {
      // ignore
    }
  }, [dirty]);

  // Keep input in sync with URL changes (back/forward / server navigation).
  useEffect(() => {
    setQ(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  const dirtyCount = useMemo(() => Object.keys(dirty).length, [dirty]);

  const setField = (productId: string, patch: Partial<BulkProductUpdate>) => {
    setDirty((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? { id: productId }), id: productId, ...patch },
    }));
  };

  const clearDirty = () => {
    setDirty({});
    try {
      sessionStorage.removeItem(DIRTY_KEY);
    } catch {
      // ignore
    }
  };

  const onSearchChange = (next: string) => {
    setQ(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (next.trim()) sp.set("q", next.trim());
      else sp.delete("q");
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }, 300) as unknown as number;
  };

  const onSaveAll = () => {
    const payload = Object.values(dirty).map((u) => ({ id: u.id!, ...u })) as BulkProductUpdate[];
    if (payload.length === 0) return;

    startTransition(async () => {
      try {
        await bulkUpdateProducts(payload);
        toast.success("Saved");
        clearDirty();
        router.refresh();
      } catch (e) {
        toast.error("Save failed");
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-zinc-900">Products</h2>
          <p className="text-xs text-zinc-500">
            Edit multiple products, then save once. {dirtyCount > 0 ? `${dirtyCount} product(s) have unsaved changes.` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, slug, or barcode"
            className="w-64 rounded-full border border-zinc-300 px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSaving || dirtyCount === 0}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save all changes"}
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {products.map((product) => {
          const d = dirty[product.id] ?? {};
          const displayWeight = d.weight ?? product.weight ?? "";
          const displayBarcode = d.barcode ?? product.barcode ?? "";
          const displayCategoryId = d.categoryId ?? product.categoryId ?? "";
          const displayLocation = (d.stockLocation ?? product.stockLocation ?? "instock") as "instock" | "warehouse";
          const displayQty = d.quantity ?? totalStock(product.variants);
          const displayPrice = d.price ?? product.price;
          const displayActive = d.active ?? product.active;

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
            >
              <div className="flex items-start gap-3">
                {product.images[0] ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-zinc-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        /products/{product.slug}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-zinc-700">
                      {product.currency} {Number(displayPrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {product.weight && <>Weight: {product.weight} · </>}
                    {product.category && <>Category: {product.category.name} · </>}
                    Stock: {product.stockLocation === "warehouse" ? "Warehouse (5–7 days)" : `${totalStock(product.variants)} in stock`}
                    {product.images.length > 0 && <> · {product.images.length} image(s)</>}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Stock</p>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-zinc-500">Qty</label>
                      <input
                        type="number"
                        min={0}
                        value={String(displayQty)}
                        onChange={(e) => setField(product.id, { quantity: Math.max(0, Math.floor(coerceNumber(e.target.value) ?? 0)) })}
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Location</p>
                    <select
                      value={displayLocation}
                      onChange={(e) => setField(product.id, { stockLocation: e.target.value as "instock" | "warehouse" })}
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    >
                      <option value="instock">In stock</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-zinc-700">Category</p>
                      <select
                        value={displayCategoryId ?? ""}
                        onChange={(e) => setField(product.id, { categoryId: e.target.value || null })}
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      >
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Barcode</p>
                    <input
                      type="text"
                      value={displayBarcode ?? ""}
                      onChange={(e) => setField(product.id, { barcode: e.target.value || null })}
                      placeholder="Barcode"
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Weight</p>
                    <input
                      type="text"
                      value={displayWeight ?? ""}
                      onChange={(e) => setField(product.id, { weight: e.target.value || null })}
                      placeholder="e.g. 500g"
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Price</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{product.currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={String(displayPrice)}
                        onChange={(e) => {
                          const price = coerceNumber(e.target.value);
                          setField(product.id, { price: price !== undefined ? Math.max(0, price) : 0 });
                        }}
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      checked={Boolean(displayActive)}
                      onChange={(e) => setField(product.id, { active: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    Active
                  </label>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                  >
                    Edit details
                  </Link>
                </div>
                <DeleteProductButton
                  productId={product.id}
                  productName={product.name}
                  deleteAction={deleteProductAction}
                />
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <p className="text-sm text-zinc-500">No products found.</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSaveAll}
          disabled={isSaving || dirtyCount === 0}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save all changes"}
        </button>
      </div>
    </div>
  );
}

