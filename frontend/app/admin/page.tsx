import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [
    ordersCount,
    paidOrdersCount,
    revenueResult,
    productsCount,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING", "SHIPPED"] } } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED"] } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.inventoryItem.count({ where: { quantity: { lte: 5 } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: true }, take: 2 },
      },
    }),
  ]);

  const revenue = Number(revenueResult._sum.total ?? 0);

  const stats = [
    {
      label: "Total orders",
      value: ordersCount,
      href: "/admin/orders",
      sub: `${paidOrdersCount} paid/processing`,
    },
    {
      label: "Revenue",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(revenue),
      href: "/admin/orders",
      sub: "Paid orders only",
    },
    {
      label: "Products",
      value: productsCount,
      href: "/admin/products",
      sub: "Active products",
    },
    {
      label: "Low stock",
      value: lowStockCount,
      href: "/admin/inventory",
      sub: lowStockCount > 0 ? "Needs attention" : "All good",
    },
  ];

  const quickLinks = [
    { href: "/admin/products", label: "Products", desc: "Add or edit products" },
    { href: "/admin/orders", label: "Orders", desc: "View and update status" },
    { href: "/admin/inventory", label: "Inventory", desc: "Stock levels" },
    { href: "/admin/shipping", label: "Shipping", desc: "Zones & methods" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of your store
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, sub }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent orders */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all →
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                No orders yet
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href="/admin/orders"
                      className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-zinc-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {order.orderNumber}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {order.email} ·{" "}
                          {order.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-zinc-900">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: order.currency,
                          }).format(Number(order.total))}
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === "PAID" || order.status === "SHIPPED"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.status === "CANCELLED" || order.status === "REFUNDED"
                                ? "bg-zinc-100 text-zinc-600"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-900">Quick actions</h2>
          <div className="mt-3 space-y-2">
            {quickLinks.map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow"
              >
                <p className="font-medium text-zinc-900">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
