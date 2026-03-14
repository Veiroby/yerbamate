import { prisma } from "@/lib/db";
import { isEmailConfigured, sendOrderConfirmationEmail } from "@/lib/email";
import { OrderStatus } from "@/app/generated/prisma/client";
import { DpdLabelButton } from "./dpd-label-button";

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
          {orders.map((order) => {
            const shippingAddress = order.shippingAddress as ShippingAddress | null;
            const isDpdOrder = !!shippingAddress?.dpdPickupPointId;

            return (
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
                      createdAt: updated.createdAt,
                      subtotal: updated.subtotal,
                      shippingCost: updated.shippingCost,
                      tax: updated.tax,
                      shippingAddress: updated.shippingAddress,
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

                {/* Shipping Info */}
                {shippingAddress && (
                  <div className="rounded-lg bg-zinc-50 p-2 text-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-zinc-700">
                          {isDpdOrder ? "📦 DPD Pickup" : "🚚 Delivery"}
                        </p>
                        {isDpdOrder ? (
                          <>
                            <p className="text-zinc-600">
                              {shippingAddress.dpdPickupPointName}
                            </p>
                            <p className="text-zinc-500">
                              ID: {shippingAddress.dpdPickupPointId}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-zinc-600">{shippingAddress.name}</p>
                            <p className="text-zinc-500">
                              {shippingAddress.line1}
                              {shippingAddress.line2 && `, ${shippingAddress.line2}`}
                            </p>
                            <p className="text-zinc-500">
                              {shippingAddress.city}, {shippingAddress.postalCode},{" "}
                              {shippingAddress.country}
                            </p>
                          </>
                        )}
                      </div>
                      {isDpdOrder && (
                        <DpdLabelButton
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                          hasLabel={!!order.dpdLabelPdf}
                          trackingNumber={order.dpdTrackingNumber}
                          shipmentId={order.dpdShipmentId}
                        />
                      )}
                    </div>
                    {order.dpdTrackingNumber && (
                      <p className="mt-1 text-zinc-500">
                        Tracking: <span className="font-mono">{order.dpdTrackingNumber}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Order Items */}
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

                {/* Discount */}
                {order.discountCode && (
                  <div className="flex items-center justify-between text-xs text-emerald-700">
                    <span>Discount ({order.discountCode})</span>
                    <span>
                      -{(Number(order.discountAmount) || 0).toFixed(2)} {order.currency}
                    </span>
                  </div>
                )}

                {/* Shipping Cost */}
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Shipping</span>
                  <span>
                    {(order.shippingCost as unknown as number).toFixed(2)} {order.currency}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t pt-1 text-xs font-semibold">
                  <span>Total</span>
                  <span>
                    {(order.total as unknown as number).toFixed(2)}{" "}
                    {order.currency}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${
                    order.paymentMethod === "WIRE_TRANSFER"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {order.paymentMethod === "WIRE_TRANSFER" ? "Wire Transfer" : "Stripe"}
                  </span>
                  {order.customerType === "BUSINESS" && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                      Business
                    </span>
                  )}
                </div>
              </form>
            );
          })}
          {orders.length === 0 && (
            <p className="text-sm text-zinc-500">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
