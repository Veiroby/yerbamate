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
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Admin
            </h1>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-emerald-600"
          >
            View store
          </Link>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
