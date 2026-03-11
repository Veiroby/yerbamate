import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { active } = body;

    const discount = await prisma.discountCode.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json({ discount });
  } catch (error) {
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.discountCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 },
    );
  }
}
