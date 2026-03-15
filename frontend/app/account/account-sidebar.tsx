"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";

export const navItems = [
  { href: "/account/profile", label: "Account Dashboard" },
  { href: "/account/information", label: "Account Information" },
  { href: "/account/addresses", label: "Address Book" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/wishlist", label: "My Wishlist" },
  { href: "/account/newsletter", label: "Newsletter Subscriptions" },
];

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/account/profile" && pathname.startsWith(href))
  );
}

type AccountSidebarProps = {
  variant: "sidebar" | "tabs";
  className?: string;
};

export function AccountSidebar({ variant, className = "" }: AccountSidebarProps) {
  const pathname = usePathname();
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "tabs" || !tabsRef.current) return;
    const active = tabsRef.current.querySelector("[data-active=true]");
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [pathname, variant]);

  if (variant === "tabs") {
    return (
      <div className={`shrink-0 md:hidden ${className}`.trim()}>
        <nav
          ref={tabsRef}
          className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {navItems.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                data-active={active}
                className={`shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                  active
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <form action="/api/auth/logout" method="post" className="shrink-0 ml-1 border-l border-gray-200 pl-2">
            <button
              type="submit"
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    );
  }

  return (
    <aside className={`hidden w-56 shrink-0 md:block ${className}`.trim()}>
      <nav className="sticky top-6 space-y-0.5 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {navItems.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <div className="border-t border-gray-100 pt-2 mt-2">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
