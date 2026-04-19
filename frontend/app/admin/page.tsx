import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminSalesChart, type SalesChartPoint } from "@/app/components/admin/admin-sales-chart";

const PAID_LIKE = ["PAID", "PROCESSING", "SHIPPED"] as const;

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const chartStart = new Date(todayStart);
  chartStart.setUTCDate(chartStart.getUTCDate() - 13);

  const [
    ordersCount,
    paidOrdersCount,
    revenueAllTime,
    revenueToday,
    revenueWeek,
    revenueMonth,
    productsCount,
    lowStockCount,
    recentOrders,
    statusGroups,
    topSellingRows,
    newCustomersCount,
    chartOrders,
    currencySample,
  ] = await Promise.all([
    prisma.order.count({ where: { archived: false } }),
    prisma.order.count({
      where: {
        archived: false,
        status: { in: [...PAID_LIKE] },
      },
    }),
    prisma.order.aggregate({
      where: {
        archived: false,
        status: { in: [...PAID_LIKE] },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        archived: false,
        status: { in: [...PAID_LIKE] },
        createdAt: { gte: todayStart },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        archived: false,
        status: { in: [...PAID_LIKE] },
        createdAt: { gte: weekStart },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        archived: false,
        status: { in: [...PAID_LIKE] },
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { active: true, archived: false, isDraft: false } }),
    prisma.inventoryItem.count({ where: { quantity: { lte: 5 } } }),
    prisma.order.findMany({
      where: { archived: false },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: true }, take: 2 },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { archived: false },
      _count: { id: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
        product: { isDraft: false },
        order: {
          archived: false,
          status: { in: [...PAID_LIKE] },
          createdAt: { gte: monthStart },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.user.count({
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.order.findMany({
      where: {
        archived: false,
        status: { in: [...PAID_LIKE] },
        createdAt: { gte: chartStart },
      },
      select: { createdAt: true, total: true, currency: true },
    }),
    prisma.order.findFirst({
      where: { archived: false, status: { in: [...PAID_LIKE] } },
      orderBy: { createdAt: "desc" },
      select: { currency: true },
    }),
  ]);

  const shopCurrency = currencySample?.currency ?? "EUR";
  const revenueLifetime = Number(revenueAllTime._sum.total ?? 0);
  const revTodayN = Number(revenueToday._sum.total ?? 0);
  const revWeekN = Number(revenueWeek._sum.total ?? 0);
  const revMonthN = Number(revenueMonth._sum.total ?? 0);

  const statusMap = Object.fromEntries(statusGroups.map((g) => [g.status, g._count.id])) as Record<
    string,
    number
  >;

  const productIds = topSellingRows.map((r) => r.productId).filter(Boolean) as string[];
  const productNames =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(productNames.map((p) => [p.id, p.name]));

  const dayKeys: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(chartStart);
    d.setUTCDate(d.getUTCDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const bucket = new Map<string, { total: number; orderCount: number }>();
  for (const k of dayKeys) bucket.set(k, { total: 0, orderCount: 0 });
  for (const o of chartOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const b = bucket.get(key);
    if (b) {
      b.total += Number(o.total);
      b.orderCount += 1;
    }
  }
  const chartPoints: SalesChartPoint[] = dayKeys.map((k) => ({
    label: k,
    total: bucket.get(k)?.total ?? 0,
    orderCount: bucket.get(k)?.orderCount ?? 0,
  }));

  const stats = [
    {
      label: "Total orders",
      value: ordersCount,
      href: "/admin/orders",
      sub: `${paidOrdersCount} paid / processing / shipped`,
    },
    {
      label: "Revenue (lifetime)",
      value: formatMoney(revenueLifetime, shopCurrency),
      href: "/admin/orders",
      sub: "Paid-like orders, all time",
    },
    {
      label: "Products",
      value: productsCount,
      href: "/admin/products",
      sub: "Active, not draft",
    },
    {
      label: "Low stock SKUs",
      value: lowStockCount,
      href: "/admin/inventory",
      sub: lowStockCount > 0 ? "≤ 5 units" : "All good",
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
          Overview of your store · amounts in {shopCurrency} where aggregated
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, sub }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Revenue by period</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Paid / processing / shipped orders</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Today</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatMoney(revTodayN, shopCurrency)}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Last 7 days</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatMoney(revWeekN, shopCurrency)}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <p className="text-xs font-medium uppercase text-zinc-500">This month</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatMoney(revMonthN, shopCurrency)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Sales (14 days)</h2>
            <p className="mt-0.5 text-xs text-zinc-500">UTC day buckets · paid-like orders</p>
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <AdminSalesChart points={chartPoints} currency={shopCurrency} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Recent orders</h2>
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                View all →
              </Link>
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {recentOrders.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">No orders yet</div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {recentOrders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-zinc-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">{order.orderNumber}</p>
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
                            {formatMoney(Number(order.total), order.currency)}
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
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Order status</h2>
            <div className="mt-3 space-y-1.5 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
              {[
                "PENDING",
                "REQUIRES_PAYMENT",
                "PAID",
                "PROCESSING",
                "SHIPPED",
                "CANCELLED",
                "REFUNDED",
              ].map((s) => (
                <div key={s} className="flex justify-between gap-2">
                  <span className="text-zinc-600">{s}</span>
                  <span className="font-medium text-zinc-900">{statusMap[s] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Best sellers (month)</h2>
            <p className="mt-0.5 text-xs text-zinc-500">By units sold on paid-like orders</p>
            <ul className="mt-2 space-y-2 rounded-2xl border border-zinc-200 bg-white p-3 text-sm">
              {topSellingRows.length === 0 ? (
                <li className="text-zinc-500">No data yet</li>
              ) : (
                topSellingRows.map((row) => (
                  <li key={row.productId ?? "x"} className="flex justify-between gap-2">
                    <span className="truncate text-zinc-800">
                      {row.productId ? nameById.get(row.productId) ?? row.productId.slice(0, 8) : "—"}
                    </span>
                    <span className="shrink-0 font-medium text-zinc-900">{row._sum.quantity ?? 0}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900">New accounts</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Registered users this month</p>
            <p className="mt-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-2xl font-semibold text-zinc-900">
              {newCustomersCount}
            </p>
          </div>

          <div>
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
          </div>
        </section>
      </div>
    </div>
  );
}
