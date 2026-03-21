"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  bulkUpdateProducts,
  deleteProductAction,
  setProductArchived,
  type BulkProductUpdate,
} from "./actions";
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
  archived: boolean;
  createdAt: string;
  categoryId: string | null;
  category?: { name: string } | null;
  stockLocation: "instock" | "warehouse" | null;
  images: { url: string; altText: string | null }[];
  variants: { inventoryItems: { quantity: number }[] }[];
};

type DirtyMap = Record<string, Partial<BulkProductUpdate>>;

const DIRTY_KEY = "yerbatea_admin_products_dirty_v1";
const NEW_PRODUCT_DAYS = 7;

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

function isNewProduct(createdAtIso: string, listView: "active" | "archived") {
  if (listView === "archived") return false;
  const ms = NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAtIso).getTime() < ms;
}

export function AdminProductsEditor({
  products,
  categories,
  listView,
}: {
  products: ProductRow[];
  categories: Category[];
  listView: "active" | "archived";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, startTransition] = useTransition();
  const [archivePending, setArchivePending] = useState<string | null>(null);

  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const debounceRef = useRef<number | null>(null);

  const [dirty, setDirty] = useState<DirtyMap>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => {
    try {
      sessionStorage.setItem(DIRTY_KEY, JSON.stringify(dirty));
    } catch {
      // ignore
    }
  }, [dirty]);

  useEffect(() => {
    setQ(initialQ);
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
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300) as unknown as number;
  };

  const buildListHref = (archived: boolean) => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (archived) sp.set("view", "archived");
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
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

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleArchive = (productId: string, archived: boolean) => {
    setArchivePending(productId);
    startTransition(async () => {
      try {
        await setProductArchived(productId, archived);
        toast.success(archived ? "Product archived" : "Product restored");
        setExpandedId(null);
        router.refresh();
      } catch {
        toast.error("Could not update archive state");
      } finally {
        setArchivePending(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: tabs, quick nav, search, save */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildListHref(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  listView === "active"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
                }`}
              >
                Active products
              </Link>
              <Link
                href={buildListHref(true)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  listView === "archived"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
                }`}
              >
                Archived
              </Link>
            </div>
            <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
              <a href="#admin-product-categories" className="font-medium text-emerald-700 hover:underline">
                Categories
              </a>
              <span aria-hidden className="text-zinc-300">
                ·
              </span>
              <a href="#admin-product-add" className="font-medium text-emerald-700 hover:underline">
                Add product
              </a>
              <span aria-hidden className="text-zinc-300">
                ·
              </span>
              <a href="#admin-product-list" className="font-medium text-emerald-700 hover:underline">
                Product list
              </a>
            </nav>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <input
              type="text"
              value={q}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, slug, barcode…"
              className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={onSaveAll}
              disabled={isSaving || dirtyCount === 0}
              className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : `Save changes${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
            </button>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          {listView === "active"
            ? "Click a row to expand and edit stock, price, and flags. Save once for all pending edits. Archive hides a product from the store and this list."
            : "Archived products are hidden from the storefront. Restore to edit them in the active list again."}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        {products.map((product) => {
          const d = dirty[product.id] ?? {};
          const displayWeight = d.weight ?? product.weight ?? "";
          const displayBarcode = d.barcode ?? product.barcode ?? "";
          const displayCategoryId = d.categoryId ?? product.categoryId ?? "";
          const displayLocation = (d.stockLocation ?? product.stockLocation ?? "instock") as
            | "instock"
            | "warehouse";
          const displayQty = d.quantity ?? totalStock(product.variants);
          const displayPrice = d.price ?? product.price;
          const displayActive = d.active ?? product.active;
          const expanded = expandedId === product.id;
          const stockLabel =
            product.stockLocation === "warehouse"
              ? "Warehouse"
              : `${totalStock(product.variants)} in stock`;
          const isNew = isNewProduct(product.createdAt, listView);

          return (
            <div
              key={product.id}
              className={`overflow-hidden rounded-xl border transition-shadow ${
                isNew
                  ? "border-emerald-300 bg-gradient-to-r from-emerald-50/90 to-white shadow-[0_0_0_1px_rgba(16,185,129,0.1)]"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`product-panel-${product.id}`}
                id={`product-summary-${product.id}`}
                onClick={() => toggleExpanded(product.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-zinc-50/90 sm:gap-4 sm:px-4"
              >
                <span
                  className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
                  aria-hidden
                >
                  <svg
                    className="h-4 w-4 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>

                {product.images[0] ? (
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-lg bg-zinc-100 ring-1 ring-zinc-200" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate font-semibold text-zinc-900">{product.name}</span>
                    {isNew && (
                      <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                    {!displayActive && (
                      <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-700">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500">/{product.slug}</p>
                </div>

                <div className="hidden min-w-0 shrink-0 text-xs text-zinc-600 sm:block md:max-w-[140px]">
                  <p className="truncate font-medium text-zinc-700">
                    {product.category?.name ?? "—"}
                  </p>
                  <p className="text-zinc-500">{stockLabel}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900">
                    {product.currency}{" "}
                    {Number(displayPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[10px] text-zinc-400 sm:hidden">Tap to edit</p>
                </div>
              </button>

              {expanded && (
                <div
                  id={`product-panel-${product.id}`}
                  role="region"
                  aria-labelledby={`product-summary-${product.id}`}
                  className="border-t border-zinc-100 bg-zinc-50/50 p-3 sm:p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                      <p className="mb-1 text-xs font-medium text-zinc-700">Stock</p>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-zinc-500">Qty</label>
                        <input
                          type="number"
                          min={0}
                          value={String(displayQty)}
                          onChange={(e) =>
                            setField(product.id, {
                              quantity: Math.max(0, Math.floor(coerceNumber(e.target.value) ?? 0)),
                            })
                          }
                          className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                      <p className="mb-1 text-xs font-medium text-zinc-700">Location</p>
                      <select
                        value={displayLocation}
                        onChange={(e) =>
                          setField(product.id, {
                            stockLocation: e.target.value as "instock" | "warehouse",
                          })
                        }
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      >
                        <option value="instock">In stock</option>
                        <option value="warehouse">Warehouse</option>
                      </select>
                    </div>

                    {categories.length > 0 && (
                      <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                        <p className="mb-1 text-xs font-medium text-zinc-700">Category</p>
                        <select
                          value={displayCategoryId ?? ""}
                          onChange={(e) =>
                            setField(product.id, { categoryId: e.target.value || null })
                          }
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
                    )}

                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                      <p className="mb-1 text-xs font-medium text-zinc-700">Barcode</p>
                      <input
                        type="text"
                        value={displayBarcode ?? ""}
                        onChange={(e) =>
                          setField(product.id, { barcode: e.target.value || null })
                        }
                        placeholder="Barcode"
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                    </div>

                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                      <p className="mb-1 text-xs font-medium text-zinc-700">Weight</p>
                      <input
                        type="text"
                        value={displayWeight ?? ""}
                        onChange={(e) =>
                          setField(product.id, { weight: e.target.value || null })
                        }
                        placeholder="e.g. 500g"
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                    </div>

                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-100">
                      <p className="mb-1 text-xs font-medium text-zinc-700">Price</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{product.currency}</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={String(displayPrice)}
                          onChange={(e) => {
                            const price = coerceNumber(e.target.value);
                            setField(product.id, {
                              price: price !== undefined ? Math.max(0, price) : 0,
                            });
                          }}
                          className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={Boolean(displayActive)}
                          onChange={(e) => setField(product.id, { active: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        Active on storefront
                      </label>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                      >
                        Full editor →
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {listView === "active" ? (
                        <button
                          type="button"
                          disabled={archivePending === product.id}
                          onClick={() => handleArchive(product.id, true)}
                          className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {archivePending === product.id ? "…" : "Archive"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={archivePending === product.id}
                          onClick={() => handleArchive(product.id, false)}
                          className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {archivePending === product.id ? "…" : "Restore to active"}
                        </button>
                      )}
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                        deleteAction={deleteProductAction}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {products.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-sm text-zinc-500">
            {listView === "archived"
              ? "No archived products."
              : "No products match your search."}
          </p>
        )}
      </div>

      <div className="flex justify-end border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={onSaveAll}
          disabled={isSaving || dirtyCount === 0}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save all changes"}
        </button>
      </div>
    </div>
  );
}
