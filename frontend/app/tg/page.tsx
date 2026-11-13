"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "./components/ProductCard";
import type { TgProduct } from "./lib/types";

type ProductsResponse = { products?: TgProduct[]; error?: string };

export default function TgHomePage() {
  const [products, setProducts] = useState<TgProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/products?sort=name-asc");
        const data = (await res.json()) as ProductsResponse;
        if (!res.ok) throw new Error(data.error || "Failed to load products");
        if (!cancelled) setProducts(data.products ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, TgProduct[]>();
    for (const product of products) {
      const key = product.category?.name || product.brand || "Products";
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [products]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-black/50">Loading catalog…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--black-forest,#283618)]">
          Order
        </h1>
        <p className="mt-1 text-sm text-black/55">
          Browse the YerbaTea catalog, add items, and send your order.
        </p>
      </section>

      {groups.map(([category, list]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--olive,#606C38)]">
            {category}
          </h2>
          <div className="space-y-2">
            {list.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
