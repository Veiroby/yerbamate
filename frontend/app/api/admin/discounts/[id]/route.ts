import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const { active } = body;

    const discount = await prisma.discountCode.update({
      where: { id },
      data: { active },
    });

    await writeAuditLog(g.user.id, "discount.updated", "DiscountCode", id, { active });

    return NextResponse.json({ discount });
  } catch (error) {
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;

  try {
    await prisma.discountCode.delete({
      where: { id },
    });

    await writeAuditLog(g.user.id, "discount.deleted", "DiscountCode", id, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 },
    );
  }
}
