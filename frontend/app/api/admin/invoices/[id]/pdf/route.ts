import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { buildInvoiceFilename } from "@/lib/invoice";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const g = await adminApiGuard(false);
  if (!g.ok) return g.response;

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      invoiceNumber: true,
      pdfBase64: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdfBuffer = Buffer.from(invoice.pdfBase64, "base64");
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildInvoiceFilename(invoice.invoiceNumber)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
