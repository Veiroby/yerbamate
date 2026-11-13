"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function TgHeader() {
  const { itemCount } = useCart();

  return (
    <header className="tg-header">
      <Link href="/tg" className="tg-brand tg-header__brand">
        YerbaTea
      </Link>
      <Link href="/tg/cart" className="tg-cart-btn" aria-label="Open cart">
        Cart
        {itemCount > 0 ? <span className="tg-cart-btn__count">{itemCount}</span> : null}
      </Link>
    </header>
  );
}
