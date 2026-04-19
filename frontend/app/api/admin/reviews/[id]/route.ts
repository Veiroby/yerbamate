import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status === "APPROVED" || body.status === "PENDING" ? body.status : undefined;
  if (!status) {
    return NextResponse.json({ error: "status must be APPROVED or PENDING" }, { status: 400 });
  }

  await prisma.review.update({
    where: { id },
    data: { status },
  });

  await writeAuditLog(g.user.id, "review.status_updated", "Review", id, { status });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;

  await prisma.review.delete({
    where: { id },
  });

  await writeAuditLog(g.user.id, "review.deleted", "Review", id, {});

  return NextResponse.json({ ok: true });
}
