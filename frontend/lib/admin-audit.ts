import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

export async function writeAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId: entityId ?? undefined,
        metadata: metadata ?? undefined,
      },
    });
  } catch (e) {
    console.error("[admin-audit]", e);
  }
}
