"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AdminSidebar } from "./admin-sidebar";
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
        className={
          dark
            ? "flex min-h-screen bg-zinc-950 text-zinc-100"
            : "flex min-h-screen bg-zinc-50 text-zinc-900"
        }
        style={{ colorScheme: dark ? "dark" : "light" }}
        suppressHydrationWarning
      >
        <SaveNotification />
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-x-auto pl-14 md:pl-0">
          <header
            className={
              dark
                ? "sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4"
                : "sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4"
            }
          >
            <div className="min-w-0">
              <h1
                className={
                  dark
                    ? "truncate text-base font-semibold tracking-tight text-zinc-100 sm:text-lg"
                    : "truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg"
                }
              >
                Admin
              </h1>
              <p
                className={
                  dark
                    ? "truncate text-xs text-zinc-400"
                    : "truncate text-xs text-zinc-500"
                }
              >
                {userEmail}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {mounted && (
                <button
                  type="button"
                  onClick={toggleDark}
                  className={
                    dark
                      ? "rounded-full border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                      : "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  }
                  aria-pressed={dark}
                >
                  {dark ? "Light" : "Dark"}
                </button>
              )}
              <Link
                href="/"
                className={
                  dark
                    ? "text-sm font-medium text-zinc-300 hover:text-emerald-400"
                    : "text-sm font-medium text-zinc-600 hover:text-emerald-600"
                }
              >
                View store
              </Link>
            </div>
          </header>
          <div
            className={
              dark
                ? "min-w-0 p-4 sm:p-6 [&_.border-zinc-200]:border-zinc-700 [&_.bg-white]:bg-zinc-900 [&_.text-zinc-900]:text-zinc-100 [&_.text-zinc-600]:text-zinc-300 [&_.text-zinc-500]:text-zinc-400 [&_.text-zinc-700]:text-zinc-200"
                : "min-w-0 p-4 sm:p-6"
            }
          >
            {children}
          </div>
        </main>
      </div>
    </AdminThemeContext.Provider>
  );
}
