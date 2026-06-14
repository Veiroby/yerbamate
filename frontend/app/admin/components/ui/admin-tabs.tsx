"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AdminTab = {
  id: string;
  label: string;
  href: string;
  count?: number;
};

export function AdminTabs({ tabs, activeId }: { tabs: AdminTab[]; activeId: string }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-[var(--admin-border)]">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`relative -mb-px rounded-t-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-[inset_0_-2px_0_0_var(--admin-primary)]"
                : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text)]"
            }`}
          >
            {tab.label}
            {tab.count != null ? (
              <span className="ml-1.5 text-xs text-[var(--admin-text-subdued)]">
                ({tab.count})
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function AdminSearchBar({
  placeholder = "Search products, orders…",
  defaultPath = "/admin/products",
}: {
  placeholder?: string;
  defaultPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";

  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const q = fd.get("q")?.toString().trim() ?? "";
        const base =
          pathname.startsWith("/admin/orders")
            ? "/admin/orders"
            : pathname.startsWith("/admin/customers")
              ? "/admin/customers"
              : defaultPath;
        const url = q ? `${base}?q=${encodeURIComponent(q)}` : base;
        router.push(url);
      }}
    >
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-subdued)]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </span>
      <input
        name="q"
        type="search"
        defaultValue={currentQ}
        placeholder={placeholder}
        className="admin-input w-full py-2 pl-9 pr-3"
        aria-label="Search admin"
      />
    </form>
  );
}
