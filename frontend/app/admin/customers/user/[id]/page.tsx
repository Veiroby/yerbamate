import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { saveCustomerProfileForm } from "../../customer-profile-actions";

const PAID_LIKE = ["PAID", "PROCESSING", "SHIPPED"] as const;

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerUserPage({ params }: Props) {
  const admin = await getCurrentUser();
  if (!admin || !hasAdminAccess(admin)) notFound();

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        where: { archived: false },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) notFound();

  const paidOrders = user.orders.filter((o) => PAID_LIKE.includes(o.status as (typeof PAID_LIKE)[number]));
  const totalSpend = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const aov = paidOrders.length > 0 ? totalSpend / paidOrders.length : 0;

  const profile = await prisma.customerProfile.findUnique({
    where: { email: user.email.toLowerCase() },
  });

  return (
    <div className="space-y-8">
      <Link href="/admin/customers" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Customers
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{user.email}</h1>
        <p className="text-sm text-zinc-500">{user.name ?? "No name on file"}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-zinc-500">Orders</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{user.orders.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-zinc-500">Spend (paid-like)</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{totalSpend.toFixed(2)}</p>
          <p className="text-xs text-zinc-400">Mixed currency possible</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-zinc-500">AOV (paid-like)</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{aov.toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Internal notes &amp; tags</h2>
        <p className="text-xs text-zinc-500">Stored on customer profile (keyed by email).</p>
        <form action={saveCustomerProfileForm} className="mt-4 space-y-3">
          <input type="hidden" name="email" value={user.email} />
          <input type="hidden" name="userId" value={user.id} />
          <label className="block text-sm">
            <span className="text-zinc-600">Tags (comma-separated)</span>
            <input
              name="tags"
              defaultValue={profile?.tags?.join(", ") ?? ""}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="vip, wholesale, …"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600">Internal notes</span>
            <textarea
              name="internalNotes"
              rows={5}
              defaultValue={profile?.internalNotes ?? ""}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">Order history</h2>
        <ul className="divide-y divide-zinc-100">
          {user.orders.length === 0 ? (
            <li className="px-4 py-6 text-sm text-zinc-500">No orders</li>
          ) : (
            user.orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-zinc-50"
                >
                  <span className="font-mono text-xs text-zinc-900">{o.orderNumber}</span>
                  <span className="text-zinc-500">{o.status}</span>
                  <span className="font-medium text-zinc-900">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency }).format(
                      Number(o.total),
                    )}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
