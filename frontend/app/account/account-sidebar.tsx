"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/account/profile", label: "Account Dashboard" },
  { href: "/account/information", label: "Account Information" },
  { href: "/account/addresses", label: "Address Book" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/wishlist", label: "My Wishlist" },
  { href: "/account/newsletter", label: "Newsletter Subscriptions" },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0">
      <nav className="sticky top-6 space-y-0.5 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {navItems.map(({ href, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/account/profile" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
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
