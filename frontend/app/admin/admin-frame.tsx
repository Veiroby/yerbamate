"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  Suspense,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLiveSync } from "./admin-live-sync";
import { AdminSidebar } from "./admin-sidebar";
import { AdminPageTitle } from "./components/admin-page-title";
import { AdminSearchBar } from "./components/ui/admin-tabs";
import { SaveNotification } from "@/app/components/save-notification";

const STORAGE_KEY = "yerbatea-admin-dark";

type AdminThemeContextValue = { dark: boolean };

const AdminThemeContext = createContext<AdminThemeContextValue>({ dark: false });

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

export function AdminFrame({
  userEmail,
  children,
}: {
  userEmail: string;
  children: ReactNode;
}) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    setDark(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const themeCtx = useMemo(() => ({ dark }), [dark]);

  return (
    <AdminThemeContext.Provider value={themeCtx}>
      <div
        className={`admin-root flex min-h-screen ${dark ? "admin-dark" : ""}`}
        style={{ colorScheme: dark ? "dark" : "light" }}
        suppressHydrationWarning
      >
        <SaveNotification />
        <AdminSidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1 overflow-x-auto md:pl-60">
          <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border-strong)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)] md:hidden"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-[var(--admin-text)] sm:text-lg">
                    <AdminPageTitle />
                  </h1>
                  <p className="truncate text-xs text-[var(--admin-text-secondary)]">
                    {userEmail}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminLiveSync />
                {mounted ? (
                  <button
                    type="button"
                    onClick={toggleDark}
                    className="rounded-lg border border-[var(--admin-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)]"
                    aria-pressed={dark}
                  >
                    {dark ? "Light" : "Dark"}
                  </button>
                ) : null}
                <Link
                  href="/"
                  className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-medium text-[var(--admin-primary-text)] hover:bg-[var(--admin-primary-hover)]"
                >
                  View store
                </Link>
              </div>
            </div>
            <Suspense fallback={null}>
              <AdminSearchBar />
            </Suspense>
          </header>
          <div className="admin-legacy-content min-w-0 p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </AdminThemeContext.Provider>
  );
}
