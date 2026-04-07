"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { useTranslation } from "@/lib/translation-context";

export const navItems = [
  { path: "account/profile", labelKey: "account.navDashboard" },
  { path: "account/information", labelKey: "account.navInformation" },
  { path: "account/addresses", labelKey: "account.navAddresses" },
  { path: "account/orders", labelKey: "account.navOrders" },
  { path: "account/wishlist", labelKey: "account.navWishlist" },
  { path: "account/newsletter", labelKey: "account.navNewsletter" },
  { path: "account/settings", labelKey: "account.settings" },
];

function isActive(pathname: string, path: string, localePrefix: string) {
  const fullPath = localePrefix ? `${localePrefix}/${path}` : `/${path}`;
  return (
    pathname === fullPath ||
    (path !== "account/profile" && pathname.startsWith(fullPath))
  );
}

type AccountSidebarProps = {
  variant: "sidebar" | "tabs";
  className?: string;
};

export function AccountSidebar({ variant, className = "" }: AccountSidebarProps) {
  const pathname = usePathname();
  const tabsRef = useRef<HTMLDivElement>(null);
  const localePrefix = pathname?.match(/^\/(lv|en)/)?.[0] ?? "";
  const { t } = useTranslation();

  useEffect(() => {
    if (variant !== "tabs" || !tabsRef.current) return;
    const active = tabsRef.current.querySelector("[data-active=true]");
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [pathname, variant]);

  if (variant === "tabs") {
    // Profile page uses a card grid instead of tabs.
    if (pathname?.endsWith("/account/profile")) return null;
    return (
      <div className={`shrink-0 lg:hidden ${className}`.trim()}>
        <nav
          ref={tabsRef}
          className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {navItems.map(({ path, labelKey }) => {
            const href = localePrefix ? `${localePrefix}/${path}` : `/${path}`;
            const active = isActive(pathname, path, localePrefix);
            return (
              <Link
                key={path}
                href={href}
                data-active={active}
                className={`shrink-0 rounded-full px-3 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                  active
                    ? "bg-[var(--mobile-cta)] text-white shadow-sm lg:bg-black"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {t(labelKey)}
              </Link>
            );
          })}
          <form action="/api/auth/logout" method="post" className="shrink-0 ml-1 border-l border-gray-200 pl-2">
            <button
              type="submit"
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
            >
              {t("account.logout")}
            </button>
          </form>
        </nav>
      </div>
    );
  }

  return (
    <aside className={`hidden w-56 shrink-0 lg:block ${className}`.trim()}>
      <nav className="sticky top-6 space-y-0.5 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {navItems.map(({ path, labelKey }) => {
          const href = localePrefix ? `${localePrefix}/${path}` : `/${path}`;
          const active = isActive(pathname, path, localePrefix);
          return (
            <Link
              key={path}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {t(labelKey)}
            </Link>
          );
        })}
        <div className="border-t border-gray-100 pt-2 mt-2">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700"
            >
              {t("account.logout")}
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
