import { prisma } from "@/lib/db";
import { isEmailConfigured, sendOrderConfirmationEmail } from "@/lib/email";
import { OrderStatus } from "@/app/generated/prisma/client";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Orders</h2>
        <div className="space-y-3 text-sm">
          {orders.map((order) => (
            <form
              key={order.id}
              action={async (formData) => {
                "use server";
                const status = formData.get("status")?.toString() as
                  | OrderStatus
                  | undefined;
                if (!status) return;

                const updated = await prisma.order.update({
                  where: { id: order.id },
                  data: { status },
                  include: {
                    items: { include: { product: true } },
                  },
                });

                if (
                  status === "PAID" &&
                  isEmailConfigured() &&
                  !updated.confirmationEmailSentAt
                ) {
                  const result = await sendOrderConfirmationEmail({
                    orderNumber: updated.orderNumber,
                    email: updated.email,
                    total: Number(updated.total),
                    currency: updated.currency,
                    items: updated.items,
                  });

                  if (result.ok) {
                    await prisma.order.update({
                      where: { id: updated.id },
                      data: { confirmationEmailSentAt: new Date() },
                    });
                  }
                }
              }}
              className="space-y-2 rounded-xl border border-zinc-200 p-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {order.email} •{" "}
                    {order.createdAt.toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="REQUIRES_PAYMENT">REQUIRES_PAYMENT</option>
                    <option value="PAID">PAID</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Update
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {item.product?.name ?? "Product"} × {item.quantity}
                    </span>
                    <span>
                      {(item.total as unknown as number).toFixed(2)}{" "}
                      {order.currency}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-1 text-xs font-semibold">
                <span>Total</span>
                <span>
                  {(order.total as unknown as number).toFixed(2)}{" "}
                  {order.currency}
                </span>
              </div>
            </form>
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-zinc-500">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

