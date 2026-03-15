"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";

type SiteHeaderProps = {
  user: { isAdmin: boolean } | null;
};

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/products?sort=price-asc", label: "On Sale" },
  { href: "/products?sort=newest", label: "New Arrivals" },
  { href: "/products", label: "Brands" },
];

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

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const { itemCount } = useCart();

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

  const isActive = (href: string) => {
    if (pathname !== href.split("?")[0]) return false;
    const linkUrl = new URL(href, "https://dummy");
    const linkCategory = linkUrl.searchParams.get("category") ?? "";
    const currentCategory = searchParams.get("category") ?? "";
    return linkCategory === currentCategory;
  };

  return (
    <>
      {/* Promo bar – black, dismissible (Figma-style) */}
      {!promoDismissed && (
        <div className="relative bg-black px-4 py-2.5 text-center text-sm text-white">
          <span>
            Sign up and get 20% off on your first order.{" "}
            <Link href="/account/profile" className="underline font-semibold hover:no-underline">
              Sign Up Now
            </Link>
          </span>
          <button
            type="button"
            onClick={dismissPromo}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white"
            aria-label="Close"
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
          <Link
            href="/"
            className="text-xl font-bold uppercase tracking-tight text-black hover:opacity-80"
          >
            YerbaTea
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`text-sm font-medium text-gray-700 hover:text-black ${isActive(href) ? "text-black font-semibold" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center text-gray-700 hover:text-black"
              aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <CartIcon className="h-5 w-5" />
              <CartBadge count={itemCount} />
            </Link>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="hidden text-sm font-medium text-gray-700 hover:text-black sm:block"
              >
                Admin
              </Link>
            )}
            {user ? (
              <Link
                href="/account/profile"
                className="flex h-10 w-10 items-center justify-center text-gray-700 hover:text-black"
                aria-label="Profile"
              >
                <ProfileIcon className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/account/profile"
                  className="hidden text-sm font-medium text-gray-700 hover:text-black sm:block"
                >
                  Log in
                </Link>
                <Link
                  href="/account/profile"
                  className="hidden rounded-md border-2 border-black bg-transparent px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white sm:inline-block"
                >
                  Sign up
                </Link>
              </>
            )}

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-gray-700 hover:text-black lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <div
          id="mobile-nav"
          className={`border-t border-gray-100 bg-white px-4 py-4 lg:hidden ${menuOpen ? "block" : "hidden"}`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3">
              {user ? (
                <Link
                  href="/account/profile"
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <ProfileIcon className="h-5 w-5" />
                  Account
                </Link>
              ) : (
                <>
                  <Link
                    href="/account/profile"
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/account/profile"
                    className="mt-1 block rounded-lg border-2 border-black py-3 text-center text-sm font-semibold text-black hover:bg-black hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign up
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
