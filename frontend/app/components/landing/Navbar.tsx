"use client";

import Link from "next/link";
import { useState } from "react";

const navBg = "bg-[#0f172a]"; // dark blue/charcoal
const navText = "text-white";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-40 w-full ${navBg}`}>
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className={`text-lg font-semibold ${navText} transition hover:opacity-90`}
        >
          YerbaTea
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/products"
            className={`hidden p-2 ${navText} hover:opacity-80 sm:block`}
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link
            href="/cart"
            className={`p-2 ${navText} hover:opacity-80`}
            aria-label="Cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <Link
            href="/account/profile"
            className={`p-2 ${navText} hover:opacity-80`}
            aria-label="Account"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center ${navText} hover:opacity-80 sm:hidden`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
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
        id="mobile-menu"
        className={`border-t border-white/10 ${navBg} px-4 py-4 sm:hidden ${menuOpen ? "block" : "hidden"}`}
      >
        <div className="flex flex-col gap-2">
          <Link href="/products" className={`py-2 ${navText}`} onClick={() => setMenuOpen(false)}>
            Products
          </Link>
          <Link href="/cart" className={`py-2 ${navText}`} onClick={() => setMenuOpen(false)}>
            Cart
          </Link>
          <Link href="/account/profile" className={`py-2 ${navText}`} onClick={() => setMenuOpen(false)}>
            Account
          </Link>
        </div>
      </div>
    </header>
  );
}
