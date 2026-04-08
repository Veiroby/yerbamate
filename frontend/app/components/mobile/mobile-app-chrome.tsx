"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";

type CartLine = {
  id: string;
  quantity: number;
  unitPrice: unknown;
  product: {
    name: string;
    currency?: string;
    images?: { url: string; altText?: string | null }[];
  } | null;
};

type Props = {
  locale: Locale;
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export function MobileAppChrome({ locale }: Props) {
  const pathname = usePathname();
  const prefix = `/${locale}`;
  const { t } = useTranslation();
  const { itemCount } = useCart();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);

  const loadCart = useCallback(async () => {
    setLoadingCart(true);
    try {
      const res = await fetch("/api/cart");
      const data = (await res.json()) as { cart?: { items?: CartLine[] } | null };
      const items = data.cart?.items ?? [];
      items.sort((a, b) => a.id.localeCompare(b.id));
      setLines(items);
    } catch {
      setLines([]);
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    if (sheetOpen) {
      void loadCart();
    }
  }, [sheetOpen, loadCart]);

  useEffect(() => {
    if (sheetOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sheetOpen]);

  const isHome = pathname === prefix || pathname === `${prefix}/`;
  const isSearch = pathname.startsWith(`${prefix}/search`);
  const isOrders = pathname.startsWith(`${prefix}/account/orders`);

  const subtotal = lines.reduce((sum, line) => {
    const p = Number(line.unitPrice);
    return sum + (Number.isFinite(p) ? p * line.quantity : 0);
  }, 0);
  const currency = lines.find((l) => l.product?.currency)?.product?.currency ?? "EUR";

  return (
    <>
      {/* Bottom padding reserve for fixed chrome — pages use min-h-screen; consumers add pb via layout */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-[60] pointer-events-none flex flex-col items-stretch justify-end pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))]"
        aria-hidden={false}
      >
        <div className="pointer-events-auto flex items-end justify-center gap-3">
          <nav
            className="mobile-pill flex items-center gap-1 border border-gray-200/80 bg-[var(--mobile-nav-pill)] px-2 py-2 shadow-lg backdrop-blur-md"
            aria-label={t("mobile.appNav")}
          >
            <Link
              href={prefix}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${isHome ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
              aria-current={isHome ? "page" : undefined}
            >
              <HomeIcon className="h-5 w-5" />
              <span className="sr-only">{t("nav.home")}</span>
            </Link>
            <Link
              href={`${prefix}/search`}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${isSearch ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
              aria-current={isSearch ? "page" : undefined}
            >
              <SearchIcon className="h-5 w-5" />
              <span className="sr-only">{t("nav.search")}</span>
            </Link>
            <Link
              href={`${prefix}/account/orders`}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${isOrders ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <OrdersIcon className="h-5 w-5" />
              <span className="sr-only">{t("mobile.orders")}</span>
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mobile-pill relative flex h-14 w-14 shrink-0 items-center justify-center bg-[var(--mobile-cta)] text-white shadow-lg transition hover:bg-[var(--mobile-cta-hover)] active:scale-[0.98]"
            aria-label={t("nav.cart")}
          >
            <CartIcon className="h-6 w-6" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[var(--mobile-cta)]">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {sheetOpen ? (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label={t("common.close")}
            onClick={() => setSheetOpen(false)}
          />
          <div className="mobile-sheet absolute bottom-0 left-0 right-0 max-h-[min(85vh,640px)] flex flex-col">
            <div className="flex justify-center pt-2 pb-1">
              <span className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1">
              <h2 className="text-lg font-semibold text-black">{t("mobile.quickCart")}</h2>
              <button
                type="button"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setSheetOpen(false)}
                aria-label={t("common.close")}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {loadingCart ? (
                <p className="text-sm text-gray-500">{t("cart.loadingQty")}</p>
              ) : lines.length === 0 ? (
                <p className="text-sm text-gray-600">{t("cart.empty")}</p>
              ) : (
                <ul className="space-y-4">
                  {lines.map((line) => {
                    const img = line.product?.images?.[0];
                    const price = Number(line.unitPrice);
                    const lineTotal = Number.isFinite(price) ? price * line.quantity : 0;
                    return (
                      <li key={line.id} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {img?.url ? (
                            <Image src={img.url} alt={img.altText ?? line.product?.name ?? ""} fill className="object-cover" sizes="64px" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-black line-clamp-2">{line.product?.name ?? t("common.product")}</p>
                          <p className="text-xs text-gray-500">
                            {t("checkout.qty")} {line.quantity}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-black">
                            {currency} {lineTotal.toFixed(2)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-4">
              {lines.length > 0 ? (
                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-gray-600">{t("cart.subtotal")}</span>
                  <span className="font-semibold text-black">
                    {currency} {subtotal.toFixed(2)}
                  </span>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Link
                  href={`${prefix}/cart`}
                  onClick={() => setSheetOpen(false)}
                  className="mobile-cta mobile-pill flex-1 py-3.5 text-center text-sm font-semibold"
                >
                  {t("mobile.viewFullCart")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * After each page, append an in-flow spacer so document scroll height always clears the fixed
 * bottom chrome. Padding on a wrapper often fails on iOS (overlap / white gap); block height does not.
 */
export function MobileAppContentShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div
        aria-hidden
        className="w-full shrink-0 bg-gray-50 lg:hidden"
        style={{ height: "var(--mobile-floating-chrome-inset)" }}
      />
    </>
  );
}
