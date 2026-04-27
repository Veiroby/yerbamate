"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";
type SiteHeaderProps = {
  user: { isAdmin: boolean } | null;
  locale: Locale;
};

const navLinkKeys = [
  { path: "", labelKey: "nav.home" },
  { path: "products", labelKey: "nav.products" },
  { path: "yerba-mate", labelKey: "products.categoryYerbaMate" },
  { path: "mate-gourds", labelKey: "products.categoryMateGourds" },
  { path: "accessories", labelKey: "landing.accessories" },
  { path: "about", labelKey: "nav.about" },
  { path: "blog", labelKey: "nav.blog" },
  { path: "contact", labelKey: "nav.contact" },
] as const;

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CartBadge({ count }: { count: number }) {
  const [animate, setAnimate] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  if (count === 0) return null;

  return (
    <span
      className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-xs font-bold text-white transition-transform ${
        animate ? "scale-125" : "scale-100"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const PROMO_DISMISS_KEY = "yerbatea-promo-dismissed";

export function SiteHeader({ user, locale }: SiteHeaderProps) {
  const pathname = usePathname();
  const [promoDismissed, setPromoDismissed] = useState(false);
  const { itemCount } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(PROMO_DISMISS_KEY) === "1") {
      setPromoDismissed(true);
    }
  }, []);

  const dismissPromo = () => {
    setPromoDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROMO_DISMISS_KEY, "1");
    }
  };

  const localePrefix = `/${locale}`;
  const pathAfterLocale = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const isActive = (path: string) => {
    const expected = path ? `/${path}` : "/";
    if (pathAfterLocale.split("?")[0] !== expected) return false;
    return true;
  };

  const otherLocale: Locale = locale === "lv" ? "en" : "lv";
  const switchLocalePath = pathname.replace(new RegExp(`^/${locale}(/|$)`), `/${otherLocale}$1`);

  const mobileCategoryLinks = navLinkKeys.filter((x) =>
    ["products", "yerba-mate", "mate-gourds", "accessories"].includes(x.path),
  );

  return (
    <>
      {/* Promo bar – black, dismissible (Figma-style) */}
      {!promoDismissed && (
        <div className="relative bg-black px-3 py-2.5 text-center text-sm text-white max-lg:px-[max(0.75rem,env(safe-area-inset-left))] max-lg:pr-[max(2.5rem,env(safe-area-inset-right))] sm:px-4">
          <span>
            {t("promo.signUpText")}{" "}
            <Link href={`/${locale}/account/profile`} className="underline font-semibold hover:no-underline">
              {t("promo.signUpNow")}
            </Link>
          </span>
          <button
            type="button"
            onClick={dismissPromo}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white"
            aria-label={t("common.close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main nav – white bg, black text (Figma SHOP.CO style) */}
      <header className="sticky top-0 z-40 w-full overflow-visible border-b border-transparent bg-transparent lg:border-gray-200 lg:bg-white">
        <nav
          className="relative mx-auto flex w-full max-w-none min-h-20 items-center gap-2 overflow-visible py-5 max-lg:gap-2 max-lg:pl-[max(0.75rem,env(safe-area-inset-left))] max-lg:pr-[max(0.25rem,env(safe-area-inset-right))] lg:gap-3 lg:px-6 lg:py-4 lg:min-h-0 lg:max-w-7xl lg:justify-between"
          aria-label="Main navigation"
        >
          {/* Mobile header: profile icon + category pills (no logo) */}
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
            <Link
              href={`/${locale}/account/profile`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/45 text-gray-900 shadow-sm backdrop-blur-md hover:bg-white/60"
              aria-label={user ? t("nav.account") : t("nav.logIn")}
            >
              <ProfileIcon className="h-6 w-6" />
            </Link>
            <div
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto overflow-y-visible scroll-smooth py-2 pr-2"
              style={{ WebkitOverflowScrolling: "touch" }}
              aria-label={t("mobile.appNav")}
            >
              {mobileCategoryLinks.map(({ path, labelKey }) => {
                const href = `${localePrefix}/${path}`;
                const active = isActive(path);
                return (
                  <Link
                    key={labelKey}
                    href={href}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/5 backdrop-blur-md transition ${
                      active
                        ? "ring-white/20 bg-black/70 text-white"
                        : "ring-black/10 bg-white/45 text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    {t(labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop left: logo */}
          <div className="hidden min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex lg:flex-none lg:min-w-0">
            <Link href={localePrefix} className="p-0 hover:opacity-90">
              <Image
                src="/images/yerbatea-logo.png"
                alt="yerbatea"
                width={1024}
                height={1024}
                priority
                className="h-16 w-16 object-contain"
              />
            </Link>
          </div>

          <div className="absolute left-1/2 hidden max-w-[min(100%-12rem,52rem)] -translate-x-1/2 flex-nowrap items-center justify-center gap-4 xl:gap-6 lg:flex">
            {navLinkKeys.map(({ path, labelKey }) => {
              const href = path ? `${localePrefix}/${path}` : localePrefix;
              return (
                <Link
                  key={labelKey}
                  href={href}
                  className={`shrink-0 whitespace-nowrap text-sm font-medium text-gray-700 hover:text-black ${isActive(path) ? "text-black font-semibold" : ""}`}
                >
                  {t(labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Desktop only: locale toggle + cart + account */}
          <div className="hidden flex-1 items-center justify-end gap-0.5 sm:gap-4 lg:flex lg:flex-none">
            <span className="hidden items-center gap-1 text-sm font-medium text-gray-600 sm:text-sm lg:flex">
              <Link
                href={locale === "lv" ? switchLocalePath : switchLocalePath}
                className={locale === "lv" ? "font-semibold text-black" : "hover:text-black"}
              >
                LV
              </Link>
              <span aria-hidden>|</span>
              <Link
                href={switchLocalePath}
                className={locale === "en" ? "font-semibold text-black" : "hover:text-black"}
              >
                EN
              </Link>
            </span>
            <Link
              href={`/${locale}/cart`}
              className="relative hidden h-11 w-11 items-center justify-center text-gray-700 hover:text-black lg:flex sm:h-10 sm:w-10"
              aria-label={`${t("nav.cart")}${itemCount > 0 ? t("nav.cartWithCount", { count: itemCount }) : ""}`}
            >
              <CartIcon className="h-6 w-6 sm:h-5 sm:w-5" />
              <CartBadge count={itemCount} />
            </Link>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="hidden text-sm font-medium text-gray-700 hover:text-black sm:block"
              >
                {t("nav.admin")}
              </Link>
            )}
            {user ? (
              <Link
                href={`/${locale}/account/profile`}
                className="flex h-11 w-11 items-center justify-center text-gray-700 hover:text-black sm:h-10 sm:w-10"
                aria-label={t("nav.account")}
              >
                <ProfileIcon className="h-6 w-6 sm:h-5 sm:w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href={`/${locale}/account/profile`}
                  className="hidden text-sm font-medium text-gray-700 hover:text-black sm:block"
                >
                  {t("nav.logIn")}
                </Link>
                <Link
                  href={`/${locale}/account/profile`}
                  className="hidden rounded-md border-2 border-black bg-transparent px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white sm:inline-block"
                >
                  {t("nav.signUp")}
                </Link>
              </>
            )}

          </div>
        </nav>
      </header>
    </>
  );
}
