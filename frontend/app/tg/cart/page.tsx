"use client";

import Link from "next/link";
import { useCart } from "../components/CartProvider";
import { formatMoney, productUnitPrice } from "../lib/price";

export default function TgCartPage() {
  const { items, total, setQuantity, removeItem, itemCount } = useCart();
  const currency = items[0]?.product.currency || "EUR";

  if (itemCount === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <h1 className="text-xl font-semibold">Cart is empty</h1>
        <Link href="/tg" className="text-sm text-[var(--copper,#BC6C25)]">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Cart
        </h1>
        <p className="mt-1 text-sm text-black/55">
          {itemCount} item{itemCount === 1 ? "" : "s"} · {formatMoney(total, currency)}
        </p>
      </div>

      <ul className="space-y-3">
        {items.map(({ product, quantity }) => {
          const unit = productUnitPrice(product);
          return (
            <li
              key={product.id}
              className="rounded-2xl border border-black/5 bg-white/70 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="text-sm text-[var(--copper,#BC6C25)]">
                    {formatMoney(unit * quantity, product.currency || "EUR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="text-xs text-black/45"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-black/10"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-black/10"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/tg/checkout"
        className="block w-full rounded-xl bg-[var(--copper,#BC6C25)] px-4 py-3 text-center text-sm font-semibold text-white"
      >
        Checkout · {formatMoney(total, currency)}
      </Link>
    </div>
  );
}
