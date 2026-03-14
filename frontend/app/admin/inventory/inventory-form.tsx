"use client";

import { useRef, useCallback } from "react";
import { saveInventoryAction } from "./actions";

type Product = { id: string; name: string; barcode: string | null };

type Props = {
  products: Product[];
};

export function InventoryForm({ products }: Props) {
  const productSelectRef = useRef<HTMLSelectElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const lookupByBarcode = useCallback(async () => {
    const barcode = barcodeInputRef.current?.value?.trim();
    if (!barcode) return;

    try {
      const res = await fetch(
        `/api/admin/products/by-barcode?barcode=${encodeURIComponent(barcode)}`,
      );
      if (!res.ok) return;
      const data = await res.json();

      if (data.product && productSelectRef.current) {
        productSelectRef.current.value = data.product.id;
        if (data.inventory) {
          if (quantityRef.current) quantityRef.current.value = String(data.inventory.quantity);
          if (locationRef.current) locationRef.current.value = data.inventory.location ?? "";
        } else {
          if (quantityRef.current) quantityRef.current.value = "0";
          if (locationRef.current) locationRef.current.value = "";
        }
        quantityRef.current?.focus();
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <form
      action={saveInventoryAction}
      className="space-y-4"
    >
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
        <label className="block text-xs font-medium text-emerald-800">
          Scan or type barcode (auto-fills product & quantity)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan barcode or enter code..."
            className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookupByBarcode();
              }
            }}
            onBlur={lookupByBarcode}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={lookupByBarcode}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Look up
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <select
          ref={productSelectRef}
          name="productId"
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          required
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
              {product.barcode ? ` (${product.barcode})` : ""}
            </option>
          ))}
        </select>
        <input
          ref={quantityRef}
          name="quantity"
          type="number"
          placeholder="Quantity"
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          required
        />
        <input
          ref={locationRef}
          name="location"
          placeholder="Location (optional)"
          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Save inventory
        </button>
      </div>
    </form>
  );
}
