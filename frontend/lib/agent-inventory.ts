import { prisma } from "@/lib/db";
import { getProductTotalStock } from "@/app/admin/products/product-quantity";

export async function listInventoryForAgent(options?: { lowThreshold?: number }) {
  const threshold = options?.lowThreshold ?? 3;
  const products = await prisma.product.findMany({
    where: { archived: false, isDraft: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      barcode: true,
      stockLocation: true,
      active: true,
    },
  });

  const rows = await Promise.all(
    products.map(async (product) => {
      const quantity = await getProductTotalStock(product.id);
      return {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity,
        stockLocation: product.stockLocation,
        active: product.active,
        lowStock: quantity <= threshold,
        outOfStock: quantity <= 0,
      };
    }),
  );

  const lowStock = rows.filter((r) => r.lowStock);
  const outOfStock = rows.filter((r) => r.outOfStock);

  return {
    threshold,
    totalProducts: rows.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    products: rows,
    lowStock,
    outOfStock,
  };
}

export async function findProductForAgent(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const byId = await prisma.product.findUnique({
    where: { id: trimmed },
    select: { id: true, name: true, barcode: true },
  });
  if (byId) return byId;

  const byBarcode = await prisma.product.findFirst({
    where: { barcode: trimmed },
    select: { id: true, name: true, barcode: true },
  });
  if (byBarcode) return byBarcode;

  return prisma.product.findFirst({
    where: {
      archived: false,
      name: { contains: trimmed, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, barcode: true },
  });
}
