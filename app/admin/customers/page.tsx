import { prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Customers
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Registered accounts and order history.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No customers yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {user.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {user._count.orders}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {user.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
