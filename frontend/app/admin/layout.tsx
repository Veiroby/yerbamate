import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { AdminFrame } from "./admin-frame";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !hasAdminAccess(user)) {
    redirect("/");
  }

  return <AdminFrame userEmail={user.email}>{children}</AdminFrame>;
}
