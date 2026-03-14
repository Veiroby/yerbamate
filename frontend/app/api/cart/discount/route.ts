import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 },
      );
    }

    const discount = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 400 },
      );
    }

    if (!discount.active) {
      return NextResponse.json(
        { error: "This discount code is no longer active" },
        { status: 400 },
      );
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This discount code has expired" },
        { status: 400 },
      );
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { error: "This discount code has reached its maximum uses" },
        { status: 400 },
      );
    }

    if (
      discount.minOrderValue &&
      subtotal < Number(discount.minOrderValue)
    ) {
      return NextResponse.json(
        {
          error: `Minimum order value of EUR ${Number(discount.minOrderValue).toFixed(2)} required`,
        },
        { status: 400 },
      );
    }

    let discountAmount: number;
    if (discount.type === "PERCENTAGE") {
      discountAmount = (subtotal * Number(discount.value)) / 100;
    } else {
      discountAmount = Math.min(Number(discount.value), subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: Number(discount.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { error: "Failed to validate discount code" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
