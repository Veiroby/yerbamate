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
    return <p className="tg-center tg-muted">Loading catalog…</p>;
  }

  if (error) {
    return <p className="tg-error">{error}</p>;
  }

  return (
    <div>
      <section className="tg-hero">
        <h1 className="tg-brand tg-hero__brand">YerbaTea</h1>
        <p className="tg-hero__line">
          Yerba mate &amp; mate gourds — pick items, checkout in Telegram.
        </p>
      </section>

      {groups.map(([category, list], index) => (
        <section
          key={category}
          className="tg-section"
          style={{ animationDelay: `${0.08 + index * 0.04}s` }}
        >
          <h2 className="tg-section__label">{category}</h2>
          <div className="tg-product-list">
            {list.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
