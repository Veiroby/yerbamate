"use client";

import Link from "next/link";
import { formatMoney, productUnitPrice } from "../lib/price";
import type { TgProduct } from "../lib/types";

export function ProductCard({ product }: { product: TgProduct }) {
  const image = product.images?.[0];
  const price = productUnitPrice(product);

  return (
    <Link href={`/tg/product/${product.id}`} className="tg-product-row">
      <div className="tg-product-row__media">
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
              fontSize: "0.7rem",
            }}
          >
            Mate
          </div>
        )}
      </div>
      <div className="tg-product-row__body">
        <p className="tg-product-row__name">{product.name}</p>
        <p className="tg-product-row__desc">
          {product.descriptionLv || product.descriptionEn || product.description || ""}
        </p>
        <p className="tg-product-row__price">
          {formatMoney(price, product.currency || "EUR")}
        </p>
      </div>
    </Link>
  );
}
