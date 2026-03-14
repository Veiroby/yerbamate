import { NextResponse } from "next/server";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function DELETE(request: Request) {
  const rateLimitKey = getRateLimitKey(request, "account-delete");
  const { allowed } = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000);
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      await tx.cart.deleteMany({
        where: { userId: user.id },
      });

      await tx.order.updateMany({
        where: { userId: user.id },
        data: {
          userId: null,
          email: "deleted@deleted.invalid",
          phone: null,
          shippingAddress: {},
          billingAddress: {},
          companyName: null,
          companyAddress: null,
          vatNumber: null,
        },
      });

      await tx.user.delete({
        where: { id: user.id },
      });
    });

    await destroySession();

    return NextResponse.json({
      success: true,
      message: "Your account and personal data have been deleted.",
    });
  } catch (error) {
    console.error("[Account Deletion] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please contact support." },
      { status: 500 }
    );
  }
}
