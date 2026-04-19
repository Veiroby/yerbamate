import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { addOrderAdminNote } from "../actions";
import { OrderDetailActions } from "./order-detail-actions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user)) notFound();

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true } }, variant: true },
      },
      user: { select: { id: true, email: true, name: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!order) notFound();

  const [notes, audits] = await Promise.all([
    prisma.orderAdminNote.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { email: true } } },
    }),
    prisma.adminAuditLog.findMany({
      where: { entityType: "Order", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { email: true } } },
    }),
  ]);

  const shipping = order.shippingAddress as Record<string, unknown> | null;
  const fmt = (n: number, cur: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Orders
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-zinc-500">
            {order.email}
            {order.user ? (
              <>
                {" · "}
                <Link href={`/admin/customers/user/${order.user.id}`} className="text-emerald-600 hover:underline">
                  Account: {order.user.email}
                </Link>
              </>
            ) : (
              <>
                {" · "}
                <Link
                  href={`/admin/customers/email/${Buffer.from(order.email, "utf8").toString("base64url")}`}
                  className="text-emerald-600 hover:underline"
                >
                  Guest customer profile
                </Link>
              </>
            )}
          </p>
        </div>
        <OrderDetailActions orderId={order.id} status={order.status} archived={order.archived} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Items</h2>
            <ul className="mt-3 divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span className="text-zinc-800">
                    {item.product?.name ?? "Product"} × {item.quantity}
                  </span>
                  <span className="font-medium text-zinc-900">{fmt(Number(item.total), order.currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-zinc-100 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd>{fmt(Number(order.subtotal), order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Shipping</dt>
                <dd>{fmt(Number(order.shippingCost), order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Tax</dt>
                <dd>{fmt(Number(order.tax), order.currency)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd>{fmt(Number(order.total), order.currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Timeline</h2>
            <p className="text-xs text-zinc-500">Notes and recorded admin actions</p>
            <ul className="mt-4 space-y-3 text-sm">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <p className="text-xs text-zinc-500">
                    {n.createdAt.toLocaleString()} · {n.author.email}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-800">{n.body}</p>
                </li>
              ))}
              {audits.map((a) => (
                <li key={a.id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                  <p className="text-xs text-emerald-800">
                    {a.createdAt.toLocaleString()} · {a.actor.email}
                  </p>
                  <p className="mt-1 font-mono text-xs text-emerald-900">{a.action}</p>
                  {a.metadata != null ? (
                    <pre className="mt-1 max-h-24 overflow-auto text-[10px] text-zinc-600">
                      {JSON.stringify(a.metadata, null, 0)}
                    </pre>
                  ) : null}
                </li>
              ))}
              {notes.length === 0 && audits.length === 0 ? (
                <li className="text-zinc-500">No activity yet.</li>
              ) : null}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Status</h2>
            <p className="mt-2 text-lg font-medium text-zinc-900">{order.status}</p>
            <p className="text-xs text-zinc-500">Payment: {order.paymentMethod}</p>
            <p className="text-xs text-zinc-500">Archived: {order.archived ? "yes" : "no"}</p>
            {order.invoice ? (
              <p className="mt-2 text-sm">
                <Link
                  href={`/api/admin/invoices/${order.invoice.id}/pdf`}
                  className="text-emerald-600 hover:underline"
                >
                  Invoice {order.invoice.invoiceNumber}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Shipping</h2>
            {shipping && typeof shipping === "object" ? (
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {typeof shipping.name === "string" && shipping.name ? <li>{shipping.name}</li> : null}
                {typeof shipping.line1 === "string" && shipping.line1 ? <li>{shipping.line1}</li> : null}
                {typeof shipping.city === "string" || typeof shipping.postalCode === "string" ? (
                  <li>
                    {[shipping.postalCode, shipping.city].filter(Boolean).join(" ")}
                  </li>
                ) : null}
                {typeof shipping.country === "string" && shipping.country ? <li>{shipping.country}</li> : null}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Internal note</h2>
            <form
              action={async (fd) => {
                "use server";
                await addOrderAdminNote(id, fd);
              }}
              className="mt-3 space-y-2"
            >
              <textarea
                name="body"
                rows={4}
                required
                placeholder="Add a note visible to admins only…"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Save note
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
