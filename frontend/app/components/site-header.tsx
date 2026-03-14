"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";

type SiteHeaderProps = {
  user: { isAdmin: boolean } | null;
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/products?category=yerba-mate", label: "Yerba Mate" },
  { href: "/products?category=mate-gourds", label: "Mate Gourds" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const navBg = "bg-[#283618]";
const navText = "text-[#FEFAE0]";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
      className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#BC6C25] px-1 text-xs font-bold text-[#FEFAE0] transition-transform ${
        animate ? "scale-125" : "scale-100"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  const isActive = (href: string) => {
    if (pathname !== href.split("?")[0]) return false;
    const linkUrl = new URL(href, "https://dummy");
    const linkCategory = linkUrl.searchParams.get("category") ?? "";
    const currentCategory = searchParams.get("category") ?? "";
    return linkCategory === currentCategory;
  };

  const navLinkClass = (href: string) =>
    isActive(href)
      ? "text-[#DDA15E] font-semibold"
      : `${navText} hover:opacity-90`;

  return (
    <>
      <header className={`sticky top-0 z-40 w-full ${navBg}`}>
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className={`text-lg font-semibold ${navText} transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
          >
            YerbaTea
          </Link>

          {/* Desktop: center nav links – Figma-style uppercase tracking */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`text-sm font-medium uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618] ${navLinkClass(href)}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right: cart + account (desktop) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/cart"
              className={`relative flex h-10 w-10 items-center justify-center ${navText} transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
              aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <CartIcon className="h-5 w-5" />
              <CartBadge count={itemCount} />
            </Link>
            {user ? (
              <>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className={`hidden text-sm font-medium uppercase tracking-wide ${navText} hover:opacity-90 sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/account/profile"
                  className={`hidden text-sm font-medium uppercase tracking-wide ${navText} hover:opacity-90 sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account/profile"
                  className={`hidden text-sm font-medium uppercase tracking-wide ${navText} hover:opacity-90 sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
                >
                  Log in
                </Link>
                <Link
                  href="/account/profile"
                  className={`hidden rounded border border-[#FEFAE0]/60 px-4 py-2 text-sm font-medium uppercase tracking-wide ${navText} hover:bg-[#FEFAE0]/10 sm:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
                >
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center ${navText} hover:opacity-80 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDA15E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#283618]`}
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

        {/* Mobile dropdown menu – same dark style */}
        <div
          id="mobile-nav"
          className={`border-t border-[#FEFAE0]/10 ${navBg} px-4 py-4 lg:hidden ${menuOpen ? "block" : "hidden"}`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wide ${navLinkClass(href)} hover:bg-[#FEFAE0]/10`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 border-t border-[#FEFAE0]/10 pt-3">
              {user ? (
                <>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className={`block rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wide ${navText} hover:bg-[#FEFAE0]/10`}
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/account/profile"
                    className={`block rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wide ${navText} hover:bg-[#FEFAE0]/10`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/account/profile"
                    className={`block rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wide ${navText} hover:bg-[#FEFAE0]/10`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/account/profile"
                    className="mt-2 block rounded-lg border border-[#FEFAE0]/60 py-3 text-center text-sm font-medium uppercase tracking-wide text-[#FEFAE0] hover:bg-[#FEFAE0]/10"
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
