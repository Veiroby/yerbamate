import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess, hasAdminWriteAccess } from "@/lib/admin-access";
import type { User } from "@/app/generated/prisma/client";

export type AdminGuardOk = { ok: true; user: User };
export type AdminGuardFail = { ok: false; response: NextResponse };

/**
 * Use in Route Handlers: `const g = await adminApiGuard(true); if (!g.ok) return g.response;`
 */
export async function adminApiGuard(requireWrite: boolean): Promise<AdminGuardOk | AdminGuardFail> {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user)) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (requireWrite && !hasAdminWriteAccess(user)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user };
}
