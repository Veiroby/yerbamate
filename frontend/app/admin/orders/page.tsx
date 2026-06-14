import { prisma } from "@/lib/db";
import { AdminOrdersList, type AdminSerializedOrder } from "./orders-list";
import { AdminCard, AdminPage } from "../components/ui/admin-page";
import { AdminTabs, type AdminTab } from "../components/ui/admin-tabs";

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dpdPickupPointId?: string;
  dpdPickupPointName?: string;
};

type OrderView = "all" | "unpaid" | "open" | "archived";

function viewWhere(view: OrderView, archivedOnly: boolean) {
  if (archivedOnly || view === "archived") {
    return { archived: true };
  }
  const base = { archived: false };
  if (view === "unpaid") {
    return {
      ...base,
      status: { in: ["PENDING", "REQUIRES_PAYMENT"] as const },
    };
  }
  if (view === "open") {
    return {
      ...base,
      status: { in: ["PAID", "PROCESSING"] as const },
    };
  }
  return base;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view: viewParam, q } = await searchParams;
  const archivedOnly = viewParam === "archived";
  const view: OrderView =
    viewParam === "unpaid" || viewParam === "open" || viewParam === "archived"
      ? viewParam
      : "all";

  const where = {
    ...viewWhere(view, archivedOnly),
    ...(q?.trim()
      ? {
          OR: [
            { orderNumber: { contains: q.trim(), mode: "insensitive" as const } },
            { email: { contains: q.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    Promise.all([
      prisma.order.count({ where: { archived: false } }),
      prisma.order.count({
        where: {
          archived: false,
          status: { in: ["PENDING", "REQUIRES_PAYMENT"] },
        },
      }),
      prisma.order.count({
        where: {
          archived: false,
          status: { in: ["PAID", "PROCESSING"] },
        },
      }),
      prisma.order.count({ where: { archived: true } }),
    ]),
  ]);

  const [allCount, unpaidCount, openCount, archivedCount] = counts;

  const tabs: AdminTab[] = [
    { id: "all", label: "All", href: "/admin/orders", count: allCount },
    {
      id: "unpaid",
      label: "Unpaid",
      href: "/admin/orders?view=unpaid",
      count: unpaidCount,
    },
    {
      id: "open",
      label: "Open",
      href: "/admin/orders?view=open",
      count: openCount,
    },
    {
      id: "archived",
      label: "Archived",
      href: "/admin/orders?view=archived",
      count: archivedCount,
    },
  ];

  const serialized: AdminSerializedOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    userId: order.userId,
    accountEmail: order.user?.email ?? null,
    accountName: order.user?.name ?? null,
    phone: order.phone,
    companyAddress: order.companyAddress,
    vatNumber: order.vatNumber,
    billingAddress: order.billingAddress,
    sessionId: order.sessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    maksekeskusTransactionId: order.maksekeskusTransactionId,
    status: order.status,
    archived: order.archived,
    createdAt: order.createdAt.toISOString(),
    customerType: order.customerType,
    paymentMethod: order.paymentMethod,
    companyName: order.companyName,
    discountCode: order.discountCode,
    subtotal: Number(order.subtotal),
    discountAmount:
      order.discountAmount != null ? Number(order.discountAmount) : null,
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    total: Number(order.total),
    currency: order.currency,
    shippingAddress: order.shippingAddress as ShippingAddress | null,
    dpdLabelPdf: !!order.dpdLabelPdf,
    dpdTrackingNumber: order.dpdTrackingNumber,
    dpdShipmentId: order.dpdShipmentId,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product?.name ?? "Product",
      quantity: item.quantity,
      total: Number(item.total),
    })),
  }));

  return (
    <AdminPage
      title="Orders"
      subtitle={
        archivedOnly || view === "archived"
          ? "Shipped orders auto-archive. Unarchive anytime."
          : "New orders from the last 7 days are highlighted."
      }
    >
      <AdminTabs tabs={tabs} activeId={view === "all" && !archivedOnly ? "all" : view} />

      <AdminCard
        title={archivedOnly || view === "archived" ? "Archived orders" : "All orders"}
        subtitle={
          q?.trim()
            ? `Showing results for “${q.trim()}”`
            : `${serialized.length} order${serialized.length === 1 ? "" : "s"}`
        }
        flush
      >
        <div className="p-4 sm:p-5">
          <AdminOrdersList orders={serialized} />
        </div>
      </AdminCard>
    </AdminPage>
  );
}
