import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Invoices</h2>
          <p className="text-xs text-zinc-500">{invoices.length} total</p>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-zinc-500">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-2">Invoice</th>
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Client email</th>
                  <th className="px-2 py-2">Client name</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2 text-right">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-zinc-100">
                    <td className="px-2 py-2 font-medium text-zinc-900">{invoice.invoiceNumber}</td>
                    <td className="px-2 py-2 text-zinc-700">{invoice.order.orderNumber}</td>
                    <td className="px-2 py-2 text-zinc-700">{invoice.customerEmail}</td>
                    <td className="px-2 py-2 text-zinc-700">{invoice.customerName ?? "-"}</td>
                    <td className="px-2 py-2 text-zinc-700">{invoice.phone ?? "-"}</td>
                    <td className="px-2 py-2 text-zinc-500">
                      {invoice.createdAt.toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Link
                        href={`/api/admin/invoices/${invoice.id}/pdf`}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                        target="_blank"
                      >
                        Download PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
