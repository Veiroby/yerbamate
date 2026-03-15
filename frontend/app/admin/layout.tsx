import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "./admin-sidebar";
import { SaveNotification } from "@/app/components/save-notification";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <SaveNotification />
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-auto pl-14 md:pl-0">
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
              Admin
            </h1>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-zinc-600 hover:text-emerald-600"
          >
            View store
          </Link>
        </header>
        <div className="min-w-0 p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
