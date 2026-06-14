import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminSalesChart, type SalesChartPoint } from "@/app/components/admin/admin-sales-chart";
import {
  AdminBadge,
  formatOrderStatus,
  orderStatusTone,
} from "./components/ui/admin-badge";
import { AdminCard, AdminPage, AdminStatCard } from "./components/ui/admin-page";

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
    <AdminPage
      title="Welcome back"
      subtitle={`Store overview · amounts in ${shopCurrency} where aggregated`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, sub }) => (
          <AdminStatCard
            key={label}
            label={label}
            value={value}
            sub={sub}
            href={href}
          />
        ))}
      </div>

      <AdminCard
        title="Revenue by period"
        subtitle="Paid, processing, and shipped orders"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subdued)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--admin-text-secondary)]">Today</p>
            <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
              {formatMoney(revTodayN, shopCurrency)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subdued)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--admin-text-secondary)]">Last 7 days</p>
            <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
              {formatMoney(revWeekN, shopCurrency)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subdued)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--admin-text-secondary)]">This month</p>
            <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
              {formatMoney(revMonthN, shopCurrency)}
            </p>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <AdminCard title="Total sales" subtitle="Last 14 days · UTC day buckets" flush>
            <div className="p-4">
              <AdminSalesChart points={chartPoints} currency={shopCurrency} />
            </div>
          </AdminCard>

          <AdminCard
            title="Recent orders"
            actions={
              <Link
                href="/admin/orders"
                className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
              >
                View all
              </Link>
            }
            flush
          >
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--admin-text-secondary)]">
                No orders yet
              </div>
            ) : (
              <ul className="divide-y divide-[var(--admin-border)]">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="admin-table-row flex items-center justify-between gap-4 px-4 py-3 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                          {order.orderNumber}
                        </p>
                        <p className="truncate text-xs text-[var(--admin-text-secondary)]">
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
                        <p className="text-sm font-medium text-[var(--admin-text)]">
                          {formatMoney(Number(order.total), order.currency)}
                        </p>
                        <AdminBadge tone={orderStatusTone(order.status)}>
                          {formatOrderStatus(order.status)}
                        </AdminBadge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </section>

        <section className="space-y-5">
          <AdminCard title="Order status" flush>
            <ul className="divide-y divide-[var(--admin-border)] text-sm">
              {[
                "PENDING",
                "REQUIRES_PAYMENT",
                "PAID",
                "PROCESSING",
                "SHIPPED",
                "CANCELLED",
                "REFUNDED",
              ].map((s) => (
                <li
                  key={s}
                  className="flex items-center justify-between gap-2 px-4 py-2.5"
                >
                  <AdminBadge tone={orderStatusTone(s)}>
                    {formatOrderStatus(s)}
                  </AdminBadge>
                  <span className="font-medium text-[var(--admin-text)]">
                    {statusMap[s] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>

          <AdminCard
            title="Best sellers"
            subtitle="By units sold this month"
          >
            <ul className="space-y-2 text-sm">
              {topSellingRows.length === 0 ? (
                <li className="text-[var(--admin-text-secondary)]">No data yet</li>
              ) : (
                topSellingRows.map((row) => (
                  <li key={row.productId ?? "x"} className="flex justify-between gap-2">
                    <span className="truncate text-[var(--admin-text)]">
                      {row.productId
                        ? nameById.get(row.productId) ?? row.productId.slice(0, 8)
                        : "—"}
                    </span>
                    <span className="shrink-0 font-medium text-[var(--admin-text)]">
                      {row._sum.quantity ?? 0}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </AdminCard>

          <AdminStatCard
            label="New customers"
            value={newCustomersCount}
            sub="Registered this month"
          />

          <AdminCard title="Shortcuts">
            <div className="space-y-2">
              {quickLinks.map(({ href, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subdued)] p-3 transition hover:bg-[var(--admin-surface-hover)]"
                >
                  <p className="font-medium text-[var(--admin-text)]">{label}</p>
                  <p className="text-xs text-[var(--admin-text-secondary)]">{desc}</p>
                </Link>
              ))}
            </div>
          </AdminCard>
        </section>
      </div>
    </AdminPage>
  );
}
