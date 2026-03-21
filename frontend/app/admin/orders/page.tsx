import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminOrdersList, type AdminSerializedOrder } from "./orders-list";

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const archivedOnly = view === "archived";

  const orders = await prisma.order.findMany({
    where: { archived: archivedOnly },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const serialized: AdminSerializedOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !archivedOnly
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Active orders
          </Link>
          <Link
            href="/admin/orders?view=archived"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              archivedOnly
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Archived
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          {archivedOnly
            ? "Shipped orders auto-archive. Unarchive anytime."
            : "New orders (7 days) are highlighted. Click a row for details."}
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">
          {archivedOnly ? "Archived orders" : "Orders"}
        </h2>
        <AdminOrdersList orders={serialized} />
      </section>
    </div>
  );
}
