import { prisma } from "@/lib/db";

const INVOICE_PREFIX = "LV26-";

/**
 * Allocates the next sequential invoice/order number (e.g. LV26-1, LV26-2, ...).
 * Stored in `InvoiceCounter` to stay consistent across multiple server instances.
 */
export async function allocateNextInvoiceOrderNumber(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const counter = await tx.invoiceCounter.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", nextNumber: 1 },
      select: { nextNumber: true },
    });

    const current = counter.nextNumber;

    await tx.invoiceCounter.update({
      where: { id: "default" },
      data: { nextNumber: { increment: 1 } },
    });

    return `${INVOICE_PREFIX}${current}`;
  });
}

