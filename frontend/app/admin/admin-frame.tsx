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

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    setDark(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

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
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-x-auto pl-14 md:pl-0">
          <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-[var(--admin-text)] sm:text-lg">
                  <AdminPageTitle />
                </h1>
                <p className="truncate text-xs text-[var(--admin-text-secondary)]">
                  {userEmail}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
          <div className="min-w-0 p-4 sm:p-6 [&_.bg-white]:bg-[var(--admin-surface)] [&_.border-zinc-200]:border-[var(--admin-border)] [&_.border-zinc-100]:border-[var(--admin-border)] [&_.divide-zinc-100]:divide-[var(--admin-border)] [&_.text-zinc-900]:text-[var(--admin-text)] [&_.text-zinc-800]:text-[var(--admin-text)] [&_.text-zinc-700]:text-[var(--admin-text)] [&_.text-zinc-600]:text-[var(--admin-text-secondary)] [&_.text-zinc-500]:text-[var(--admin-text-secondary)] [&_.text-zinc-400]:text-[var(--admin-text-subdued)] [&_.hover\\:bg-zinc-50:hover]:bg-[var(--admin-surface-hover)] [&_.bg-zinc-50]:bg-[var(--admin-surface-subdued)] [&_.bg-zinc-50\\/80]:bg-[var(--admin-surface-subdued)]">
            {children}
          </div>
        </main>
      </div>
    </AdminThemeContext.Provider>
  );
}
