import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.review.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
