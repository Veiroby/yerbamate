"use client";

import Link from "next/link";
import { useCart } from "../components/CartProvider";
import { formatMoney, productUnitPrice } from "../lib/price";

export default function TgCartPage() {
  const { items, total, setQuantity, removeItem, itemCount } = useCart();
  const currency = items[0]?.product.currency || "EUR";

  if (itemCount === 0) {
    return (
      <div className="tg-center" style={{ display: "grid", gap: "0.85rem" }}>
        <h1 className="tg-title">Cart is empty</h1>
        <Link href="/tg" className="tg-link">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.15rem" }}>
      <div>
        <h1 className="tg-title">Cart</h1>
        <p className="tg-sub">
          {itemCount} item{itemCount === 1 ? "" : "s"} · {formatMoney(total, currency)}
        </p>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.65rem" }}>
        {items.map(({ product, quantity }) => {
          const unit = productUnitPrice(product);
          return (
            <li key={product.id} className="tg-panel">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p className="tg-product-row__name">{product.name}</p>
                  <p className="tg-product-row__price">
                    {formatMoney(unit * quantity, product.currency || "EUR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="tg-muted"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  Remove
                </button>
              </div>
              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="tg-btn--ghost"
                  style={{ width: "2rem", height: "2rem", padding: 0 }}
                  onClick={() => setQuantity(product.id, quantity - 1)}
                >
                  −
                </button>
                <span style={{ minWidth: "1.5rem", textAlign: "center", fontWeight: 700 }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  className="tg-btn--ghost"
                  style={{ width: "2rem", height: "2rem", padding: 0 }}
                  onClick={() => setQuantity(product.id, quantity + 1)}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Link href="/tg/checkout" className="tg-btn">
        Checkout · {formatMoney(total, currency)}
      </Link>
    </div>
  );
}
