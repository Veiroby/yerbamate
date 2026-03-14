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
  { href: "/products?category=mate-gourds", label: "Mate gourds" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (pathname !== href.split("?")[0]) return false;
    const linkUrl = new URL(href, "https://dummy");
    const linkCategory = linkUrl.searchParams.get("category") ?? "";
    const currentCategory = searchParams.get("category") ?? "";
    return linkCategory === currentCategory;
  };

  const linkClass = (href: string) =>
    isActive(href) ? "text-[#BC6C25]" : "hover:text-[#606C38]";

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-[#606C38]/20 bg-[#FEFAE0]/95 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          {/* Mobile: hamburger (left), logo (center), spacer (right) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#283618] hover:bg-[#606C38]/15 hover:text-[#283618] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC6C25] focus-visible:ring-offset-2 lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link
            href="/"
            className="font-serif absolute left-1/2 flex -translate-x-1/2 rounded-xl text-xl font-semibold tracking-tight text-[#283618] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC6C25] focus-visible:ring-offset-2 lg:static lg:translate-x-0"
          >
            YerbaTea
          </Link>

          {/* Desktop: center nav (hidden on mobile) */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-sm font-medium lg:flex" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC6C25] focus-visible:ring-offset-2 ${linkClass(href)}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop: cart + auth (hidden on mobile) */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#283618] transition-colors hover:bg-[#606C38]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC6C25] focus-visible:ring-offset-2"
              aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <CartIcon className="h-6 w-6" />
              <CartBadge count={itemCount} />
            </Link>
            {user ? (
              <>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-lg text-sm font-medium hover:text-[#BC6C25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC6C25] focus-visible:ring-offset-2"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/account/profile"
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:border-teal-500 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account/profile"
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:border-teal-500 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  Log in
                </Link>
                <Link
                  href="/account/profile"
                  className="rounded-full bg-[#344e41] px-4 py-1.5 text-sm font-medium text-[#dad7cd] hover:bg-[#24352b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: cart icon (right) so logo stays centered */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-800 hover:bg-stone-200/80 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          >
            <CartIcon className="h-6 w-6" />
            <CartBadge count={itemCount} />
          </Link>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/50 lg:hidden"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar panel */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] border-r border-stone-200 bg-stone-50 shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
        aria-label="Navigation menu"
      >
        <div className="flex h-14 items-center justify-between border-b border-stone-200 px-4">
          <span className="font-serif text-lg font-semibold tracking-tight text-stone-900">Menu</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-200/80 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={`rounded-xl px-4 py-3 text-sm font-medium ${linkClass(href)} hover:bg-stone-200/80`}
              onClick={() => setSidebarOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="my-2 border-t border-stone-200 pt-4">
            {user ? (
              <>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-stone-200/80 hover:text-teal-700"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/account/profile"
                  className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-stone-200/80 hover:text-teal-700"
                  onClick={() => setSidebarOpen(false)}
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account/profile"
                  className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-stone-200/80 hover:text-teal-700"
                  onClick={() => setSidebarOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/account/profile"
                  className="mx-4 mt-2 block rounded-2xl bg-teal-600 py-3 text-center text-sm font-medium text-white hover:bg-teal-700"
                  onClick={() => setSidebarOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
