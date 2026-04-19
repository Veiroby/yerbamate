import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";

export async function GET() {
  const g = await adminApiGuard(false);
  if (!g.ok) return g.response;

  const discounts = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  try {
    const body = await request.json();
    const { code, type, value, minOrderValue, maxUses, expiresAt } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Code, type, and value are required" },
        { status: 400 },
      );
    }

    if (!["FIXED_AMOUNT", "PERCENTAGE"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be FIXED_AMOUNT or PERCENTAGE" },
        { status: 400 },
      );
    }

    if (type === "PERCENTAGE" && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100" },
        { status: 400 },
      );
    }

    const existingCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Discount code already exists" },
        { status: 400 },
      );
    }

    const discount = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minOrderValue: minOrderValue || null,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await writeAuditLog(g.user.id, "discount.created", "DiscountCode", discount.id, {
      code: discount.code,
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 },
    );
  }
}
