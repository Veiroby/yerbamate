"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function TgHeader() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b border-black/5 bg-[var(--tg-theme-bg-color,#fefae0)]/95 px-4 py-3 backdrop-blur">
      <Link href="/tg" className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[var(--black-forest,#283618)]">
        YerbaTea
      </Link>
      <Link
        href="/tg/cart"
        className="rounded-full bg-[var(--copper,#BC6C25)] px-3 py-1.5 text-sm font-semibold text-white"
      >
        Cart{itemCount > 0 ? ` · ${itemCount}` : ""}
      </Link>
    </header>
  );
}
