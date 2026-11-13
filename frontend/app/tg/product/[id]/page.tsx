"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartProvider";
import { formatMoney, productUnitPrice } from "../../lib/price";
import { useTelegramWebApp } from "../../lib/telegram";
import type { TgProduct } from "../../lib/types";

export default function TgProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const webApp = useTelegramWebApp();
  const [product, setProduct] = useState<TgProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = (await res.json()) as { product?: TgProduct; error?: string };
        if (!res.ok || !data.product) {
          throw new Error(data.error || "Product not found");
        }
        if (!cancelled) setProduct(data.product);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load product");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return <p className="tg-center tg-muted">Loading…</p>;
  }

  if (error || !product) {
    return (
      <div className="tg-center" style={{ display: "grid", gap: "0.75rem" }}>
        <p className="tg-error" style={{ display: "inline-block" }}>
          {error || "Not found"}
        </p>
        <Link href="/tg" className="tg-link">
          Back to catalog
        </Link>
      </div>
    );
  }

  const image = product.images?.[0];
  const price = productUnitPrice(product);
  const description =
    product.descriptionLv || product.descriptionEn || product.description || "";

  function onAdd() {
    addItem(product!, 1);
    try {
      webApp?.HapticFeedback.impactOccurred("light");
    } catch {
      // ignore
    }
    router.push("/tg/cart");
  }

  return (
    <div style={{ display: "grid", gap: "1.15rem" }}>
      <div className="tg-media-hero">
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={image.altText || product.name} />
        ) : (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              height: "100%",
              color: "var(--tg-ink-soft)",
            }}
          >
            No image
          </div>
        )}
      </div>

      <div>
        <h1 className="tg-title">{product.name}</h1>
        <p className="tg-product-row__price" style={{ fontSize: "1.15rem" }}>
          {formatMoney(price, product.currency || "EUR")}
        </p>
        {description ? <p className="tg-sub">{description}</p> : null}
      </div>

      <button type="button" onClick={onAdd} className="tg-btn">
        Add to cart
      </button>

      <Link href="/tg" className="tg-link" style={{ textAlign: "center" }}>
        ← Back to catalog
      </Link>
    </div>
  );
}
