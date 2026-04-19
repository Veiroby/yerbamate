import "server-only";

import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/app/generated/prisma/client";
import { hasAdminAccess, hasAdminWriteAccess } from "@/lib/admin-access";

export { hasAdminAccess, hasAdminWriteAccess } from "@/lib/admin-access";

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user)) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdminWrite(): Promise<User> {
  const user = await requireAdmin();
  if (!hasAdminWriteAccess(user)) {
    throw new Error("Forbidden");
  }
  return user;
}
