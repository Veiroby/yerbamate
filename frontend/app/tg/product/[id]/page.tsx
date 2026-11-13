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
    return <p className="py-8 text-center text-sm text-black/50">Loading…</p>;
  }

  if (error || !product) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-red-700">{error || "Not found"}</p>
        <Link href="/tg" className="text-sm text-[var(--copper,#BC6C25)]">
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
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-[var(--cornsilk,#FEFAE0)]">
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText || product.name}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-sm text-black/40">
            No image
          </div>
        )}
      </div>

      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--black-forest,#283618)]">
          {product.name}
        </h1>
        <p className="mt-2 text-lg font-semibold text-[var(--copper,#BC6C25)]">
          {formatMoney(price, product.currency || "EUR")}
        </p>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-black/65">{description}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-3 text-sm font-semibold text-white"
      >
        Add to cart
      </button>

      <Link href="/tg" className="block text-center text-sm text-black/50">
        ← Back to catalog
      </Link>
    </div>
  );
}
