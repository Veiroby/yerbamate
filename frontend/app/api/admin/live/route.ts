import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await adminApiGuard(false);
  if (!guard.ok) return guard.response;

  const [unread, notifications, orderStamp, inventoryStamp] = await Promise.all([
    prisma.adminNotification.count({
      where: { userId: guard.user.id, readAt: null },
    }),
    prisma.adminNotification.findMany({
      where: { userId: guard.user.id, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, body: true, href: true, createdAt: true },
    }),
    prisma.order.aggregate({ _max: { updatedAt: true } }),
    prisma.inventoryItem.aggregate({ _max: { updatedAt: true } }),
  ]);

  return NextResponse.json({
    unread,
    latestNotificationId: notifications[0]?.id ?? null,
    ordersUpdatedAt: orderStamp._max.updatedAt?.toISOString() ?? null,
    inventoryUpdatedAt: inventoryStamp._max.updatedAt?.toISOString() ?? null,
    notifications: notifications.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const guard = await adminApiGuard(false);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => null)) as { id?: string; all?: boolean } | null;
  if (body?.all) {
    await prisma.adminNotification.updateMany({
      where: { userId: guard.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (body?.id) {
    await prisma.adminNotification.updateMany({
      where: { id: body.id, userId: guard.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
