"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { useTranslation } from "@/lib/translation-context";
import type { Locale } from "@/lib/locale";
import { MobileProductSearch } from "@/app/components/mobile-product-search";

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
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const { itemCount } = useCart();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(PROMO_DISMISS_KEY) === "1") {
      setPromoDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previous || "";
    }
    return () => {
      document.body.style.overflow = previous || "";
    };
  }, [menuOpen]);

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

  return (
    <>
      {/* Promo bar – black, dismissible (Figma-style) */}
      {!promoDismissed && (
        <div className="relative bg-black px-4 py-2.5 text-center text-sm text-white">
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
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center text-gray-700 hover:text-black lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <span className="sr-only">{menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}</span>
              {menuOpen ? (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <Link
              href={localePrefix}
              className="p-0 hover:opacity-80"
            >
              <Image
                src="/images/yerbatea-logo.png"
                alt="yerbatea"
                width={1024}
                height={1024}
                priority
                className="h-11 w-11 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16"
              />
            </Link>
          </div>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
            {navLinkKeys.map(({ path, labelKey }) => {
              const href = path ? `${localePrefix}/${path}` : localePrefix;
              return (
                <Link
                  key={labelKey}
                  href={href}
                  className={`text-sm font-medium text-gray-700 hover:text-black ${isActive(path) ? "text-black font-semibold" : ""}`}
                >
                  {t(labelKey)}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <span className="flex items-center gap-1 text-base font-medium text-gray-700 sm:text-sm">
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
              className="relative flex h-11 w-11 items-center justify-center text-gray-700 hover:text-black sm:h-10 sm:w-10"
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

        <div className="border-t border-gray-100 bg-white px-4 pb-3 pt-2 lg:hidden">
          <MobileProductSearch locale={locale} />
        </div>

        <div
          id="mobile-nav"
          className={`fixed inset-0 z-50 bg-white px-6 pb-8 pt-24 lg:hidden ${menuOpen ? "block" : "hidden"}`}
        >
          <div className="flex h-full flex-col gap-2 overflow-y-auto">
            {navLinkKeys.map(({ path, labelKey }) => (
              <Link
                key={labelKey}
                href={path ? `${localePrefix}/${path}` : localePrefix}
                className="rounded-lg px-3 py-4 text-2xl font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {t(labelKey)}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3">
              {user ? (
                <Link
                  href={`/${locale}/account/profile`}
                  className="flex items-center gap-3 rounded-lg px-3 py-4 text-2xl font-semibold text-gray-800 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <ProfileIcon className="h-7 w-7" />
                  {t("nav.account")}
                </Link>
              ) : (
                <>
                  <Link
                    href={`/${locale}/account/profile`}
                    className="block rounded-lg px-3 py-4 text-2xl font-semibold text-gray-800 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.logIn")}
                  </Link>
                  <Link
                    href={`/${locale}/account/profile`}
                    className="mt-2 block rounded-lg border-2 border-black py-4 text-center text-xl font-semibold text-black hover:bg-black hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.signUp")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
