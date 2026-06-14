import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminCard, AdminPage } from "../components/ui/admin-page";

function emailToken(email: string) {
  return Buffer.from(email, "utf8").toString("base64url");
}

export default async function AdminCustomersPage() {
  const [users, guestAgg, userEmailSet] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["email"],
      where: { userId: null, archived: false },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.user.findMany({ select: { email: true } }),
  ]);

  const registeredEmails = new Set(userEmailSet.map((u) => u.email.toLowerCase()));
  const guests = guestAgg
    .filter((g) => !registeredEmails.has(g.email.toLowerCase()))
    .sort((a, b) => Number(b._sum.total ?? 0) - Number(a._sum.total ?? 0))
    .slice(0, 50);

  return (
    <AdminPage
      title="Customers"
      subtitle="Registered accounts and guest buyers (orders without a linked user)."
    >
      <AdminCard title="Registered users" flush>
        {users.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--admin-text-secondary)]">
            No customers yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-subdued)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Orders</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Joined</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="admin-table-row border-b border-[var(--admin-border)]">
                    <td className="px-4 py-3 font-medium text-[var(--admin-text)]">{user.email}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{user.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{user._count.orders}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">
                      {user.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/user/${user.id}`}
                        className="font-medium text-[var(--admin-accent)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Guest buyers"
        subtitle="Emails with orders not linked to a user account (max 50 shown)."
        flush
      >
        {guests.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--admin-text-secondary)]">
            No guest orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-subdued)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Orders</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Order total (sum)</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]" />
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.email} className="admin-table-row border-b border-[var(--admin-border)]">
                    <td className="px-4 py-3 font-medium text-[var(--admin-text)]">{g.email}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{g._count.id}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-secondary)]">
                      {Number(g._sum.total ?? 0).toFixed(2)} (mixed currency if multiple)
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/email/${emailToken(g.email)}`}
                        className="font-medium text-[var(--admin-accent)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
