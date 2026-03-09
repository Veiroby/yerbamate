import Link from "next/link";
import { prisma } from "@/lib/db";

const ABANDONED_THRESHOLD_HOURS = 24;
const DEFAULT_DAYS = 30;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = Math.min(90, Math.max(1, Number.parseInt(params.days ?? String(DEFAULT_DAYS), 10) || DEFAULT_DAYS));
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const abandonedSince = new Date();
  abandonedSince.setHours(abandonedSince.getHours() - ABANDONED_THRESHOLD_HOURS);

  const [
    revenueResult,
    ordersCount,
    paidOrdersCount,
    addToCartSessions,
    beginCheckoutSessions,
    purchaseSessions,
    convertedSessionIds,
    abandonedCarts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED"] },
        createdAt: { gte: since },
      },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.order.count({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED"] },
        createdAt: { gte: since },
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["sessionId"],
      where: {
        eventName: "add_to_cart",
        createdAt: { gte: since },
        sessionId: { not: null },
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["sessionId"],
      where: {
        eventName: "begin_checkout",
        createdAt: { gte: since },
        sessionId: { not: null },
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["sessionId"],
      where: {
        eventName: "purchase",
        createdAt: { gte: since },
      },
    }),
    prisma.order.findMany({
      where: { sessionId: { not: null }, createdAt: { gte: since } },
      select: { sessionId: true },
    }),
    prisma.cart.findMany({
      where: {
        sessionId: { not: null },
        updatedAt: { lt: abandonedSince },
        items: { some: {} },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  const convertedSet = new Set(
    convertedSessionIds.map((o) => o.sessionId).filter(Boolean),
  );
  const abandoned = abandonedCarts.filter(
    (c) => c.sessionId && !convertedSet.has(c.sessionId),
  );

  const revenue = Number(revenueResult._sum.total ?? 0);
  const funnel = {
    addToCart: addToCartSessions.length,
    beginCheckout: beginCheckoutSessions.length,
    purchase: purchaseSessions.length,
  };

  const formatCurrency = (value: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Funnel, revenue, and abandoned carts (last {days} days)
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                days === d
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {d} days
            </Link>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Revenue
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {formatCurrency(revenue)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Paid orders only</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Orders
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {ordersCount}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {paidOrdersCount} paid / processing / shipped
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Conversion (sessions)
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {funnel.addToCart > 0
              ? `${((funnel.purchase / funnel.addToCart) * 100).toFixed(1)}%`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            add_to_cart → purchase
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Abandoned carts
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {abandoned.length}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            No order in {ABANDONED_THRESHOLD_HOURS}h after last activity
          </p>
        </div>
      </div>

      {/* Funnel */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">
          Funnel (unique sessions)
        </h2>
        <div className="flex flex-wrap items-end gap-4 sm:gap-6">
          <div className="flex flex-col">
            <p className="text-xs font-medium text-zinc-500">Add to cart</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {funnel.addToCart}
            </p>
          </div>
          <span className="text-zinc-300">→</span>
          <div className="flex flex-col">
            <p className="text-xs font-medium text-zinc-500">Begin checkout</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {funnel.beginCheckout}
            </p>
          </div>
          <span className="text-zinc-300">→</span>
          <div className="flex flex-col">
            <p className="text-xs font-medium text-zinc-500">Purchase</p>
            <p className="text-2xl font-semibold text-emerald-700">
              {funnel.purchase}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${
                funnel.addToCart > 0
                  ? (funnel.purchase / funnel.addToCart) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </section>

      {/* Abandoned carts list */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">
          Abandoned carts (last 50)
        </h2>
        {abandoned.length === 0 ? (
          <p className="text-sm text-zinc-500">No abandoned carts in this window.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {abandoned.map((cart) => {
              const total = cart.items.reduce(
                (sum, i) => sum + Number(i.unitPrice) * i.quantity,
                0,
              );
              const currency = cart.items[0]?.product?.currency ?? "USD";
              return (
                <li
                  key={cart.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-500">
                      Session · last activity{" "}
                      {cart.updatedAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <ul className="mt-1 text-sm text-zinc-700">
                      {cart.items.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          {item.product?.name ?? "Product"}
                          {item.variant ? ` (${item.variant.sku})` : ""} ×{" "}
                          {item.quantity}
                        </li>
                      ))}
                      {cart.items.length > 3 && (
                        <li className="text-zinc-500">
                          +{cart.items.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(total, currency)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {cart.items.length} item
                      {cart.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
