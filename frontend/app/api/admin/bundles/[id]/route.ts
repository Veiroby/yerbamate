import { NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
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
    const { name, description, minQuantity, discountPercent, productId, active } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent;
    if (productId !== undefined) updateData.productId = productId || null;
    if (active !== undefined) updateData.active = active;

    const bundle = await prisma.bundleOffer.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    await writeAuditLog(
      g.user.id,
      "bundle.updated",
      "BundleOffer",
      id,
      JSON.parse(JSON.stringify(updateData)) as Prisma.InputJsonValue,
    );

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error("Error updating bundle offer:", error);
    return NextResponse.json(
      { error: "Failed to update bundle offer" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;

  try {
    await prisma.bundleOffer.delete({
      where: { id },
    });

    await writeAuditLog(g.user.id, "bundle.deleted", "BundleOffer", id, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bundle offer:", error);
    return NextResponse.json(
      { error: "Failed to delete bundle offer" },
      { status: 500 },
    );
  }
}
