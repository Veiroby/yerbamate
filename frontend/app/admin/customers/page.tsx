import Link from "next/link";
import { prisma } from "@/lib/db";

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
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Customers</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Registered accounts and guest buyers (orders without a linked user).
        </p>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-zinc-900">Registered users</h3>
        <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {users.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">No customers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Orders</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Joined</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{user.email}</td>
                      <td className="px-4 py-3 text-zinc-600">{user.name ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{user._count.orders}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {user.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/customers/user/${user.id}`}
                          className="text-emerald-600 hover:underline"
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
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-900">Guest buyers (top by lifetime total)</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Emails with orders not linked to a user account (max 50 shown).
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {guests.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">No guest orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Orders</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Order total (sum)</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600" />
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.email} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{g.email}</td>
                      <td className="px-4 py-3 text-zinc-600">{g._count.id}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {Number(g._sum.total ?? 0).toFixed(2)} (mixed currency if multiple)
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/customers/email/${emailToken(g.email)}`}
                          className="text-emerald-600 hover:underline"
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
        </div>
      </section>
    </div>
  );
}
