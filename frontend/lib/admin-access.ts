import type { User } from "@/app/generated/prisma/client";
import { AdminRole } from "@/app/generated/prisma/client";

/** True if the user may open /admin (read). Legacy: isAdmin; RBAC: any adminRole set. */
export function hasAdminAccess(user: Pick<User, "isAdmin" | "adminRole"> | null): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.adminRole != null;
}

/** SUPPORT is read-only; legacy isAdmin without role = full access. */
export function hasAdminWriteAccess(user: Pick<User, "isAdmin" | "adminRole"> | null): boolean {
  if (!user || !hasAdminAccess(user)) return false;
  if (user.isAdmin && user.adminRole == null) return true;
  return user.adminRole !== AdminRole.SUPPORT;
}
