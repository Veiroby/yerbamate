import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";

export async function GET(request: Request) {
  const g = await adminApiGuard(false);
  if (!g.ok) return g.response;

  const url = new URL(request.url);
  const barcode = url.searchParams.get("barcode")?.trim();
  if (!barcode) {
    return NextResponse.json(
      { error: "Missing barcode parameter" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { barcode },
  });
  if (!product) {
    return NextResponse.json({ product: null, inventory: null });
  }

  const inventory = await prisma.inventoryItem.findFirst({
    where: { sku: product.id },
  });

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
    },
    inventory: inventory
      ? {
          quantity: inventory.quantity,
          location: inventory.location,
        }
      : null,
  });
}
