"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { OrderStatus } from "@/app/generated/prisma/client";
import { DpdLabelButton } from "./dpd-label-button";
import {
  deleteOrder,
  setOrderArchived,
  updateOrderStatus,
} from "./actions";

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

export type AdminSerializedOrder = {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  archived: boolean;
  createdAt: string;
  customerType: string;
  paymentMethod: string;
  companyName: string | null;
  discountCode: string | null;
  subtotal: number;
  discountAmount: number | null;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress | null;
  dpdLabelPdf: boolean;
  dpdTrackingNumber: string | null;
  dpdShipmentId: string | null;
  items: { id: string; productName: string; quantity: number; total: number }[];
};

const NEW_ORDER_DAYS = 7;

function isNewOrder(createdAtIso: string, archived: boolean) {
  if (archived) return false;
  const ms = NEW_ORDER_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAtIso).getTime() < ms;
}

function statusBadgeClass(status: OrderStatus) {
  if (status === "PAID" || status === "SHIPPED" || status === "PROCESSING") {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80";
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80";
  }
  return "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80";
}

export function AdminOrdersList({ orders }: { orders: AdminSerializedOrder[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-2 text-sm">
      {orders.map((order) => {
        const shippingAddress = order.shippingAddress;
        const isDpdOrder = !!shippingAddress?.dpdPickupPointId;
        const isNew = isNewOrder(order.createdAt, order.archived);
        const expanded = expandedId === order.id;
        const itemCount = order.items.reduce((a, i) => a + i.quantity, 0);

        return (
          <div
            key={order.id}
            className={`overflow-hidden rounded-xl border transition-shadow ${
              isNew
                ? "border-emerald-300 bg-gradient-to-r from-emerald-50/90 to-white shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
                : "border-zinc-200 bg-white"
            }`}
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`order-details-${order.id}`}
              id={`order-summary-${order.id}`}
              onClick={() => toggle(order.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-zinc-50/80 sm:gap-4 sm:px-4"
            >
              <span
                className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
                aria-hidden
              >
                <svg
                  className="h-4 w-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-mono text-xs font-semibold text-zinc-900">
                    {order.orderNumber}
                  </span>
                  {isNew && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-500">{order.email}</p>
              </div>

              <div className="hidden shrink-0 text-xs text-zinc-500 sm:block">
                {new Date(order.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="hidden shrink-0 text-xs text-zinc-500 md:block">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </div>

              <span
                className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${statusBadgeClass(order.status)}`}
              >
                {order.status}
              </span>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-zinc-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.total)}
                </p>
                <p className="text-[10px] text-zinc-400 sm:hidden">Tap for details</p>
              </div>
            </button>

            {expanded && (
              <div
                id={`order-details-${order.id}`}
                role="region"
                aria-labelledby={`order-summary-${order.id}`}
                className="border-t border-zinc-100 bg-zinc-50/50 p-3 sm:p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <form
                    action={async (fd) => {
                      await updateOrderStatus(order.id, fd);
                      router.refresh();
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs"
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
                      disabled={pending}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Update status
                    </button>
                  </form>

                  {!order.archived ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          await setOrderArchived(order.id, true);
                          router.refresh();
                          setExpandedId(null);
                        });
                      }}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          await setOrderArchived(order.id, false);
                          router.refresh();
                        });
                      }}
                      className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Unarchive
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (
                        !confirm(
                          `Delete order ${order.orderNumber} permanently? This cannot be undone.`,
                        )
                      ) {
                        return;
                      }
                      startTransition(async () => {
                        await deleteOrder(order.id);
                        router.refresh();
                        setExpandedId(null);
                      });
                    }}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>

                <p className="mb-3 text-xs text-zinc-500 sm:hidden">
                  {new Date(order.createdAt).toLocaleString()}
                </p>

                {/* Shipping */}
                {shippingAddress && (
                  <div className="mb-3 rounded-lg bg-white p-3 text-xs shadow-sm ring-1 ring-zinc-100">
                    <div className="flex flex-wrap items-start justify-between gap-4">
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
                          hasLabel={order.dpdLabelPdf}
                          trackingNumber={order.dpdTrackingNumber}
                          shipmentId={order.dpdShipmentId}
                        />
                      )}
                    </div>
                    {order.dpdTrackingNumber && (
                      <p className="mt-2 text-zinc-500">
                        Tracking:{" "}
                        <span className="font-mono">{order.dpdTrackingNumber}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1 rounded-lg bg-white p-3 text-xs shadow-sm ring-1 ring-zinc-100">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Line items
                  </p>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 border-b border-zinc-50 py-1 last:border-0"
                    >
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="tabular-nums">
                        {item.total.toFixed(2)} {order.currency}
                      </span>
                    </div>
                  ))}
                </div>

                {order.discountCode && (
                  <div className="mt-3 flex items-center justify-between text-xs text-emerald-700">
                    <span>Discount ({order.discountCode})</span>
                    <span>
                      -{(order.discountAmount ?? 0).toFixed(2)} {order.currency}
                    </span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost.toFixed(2)} {order.currency}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-zinc-200 pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span>
                    {order.total.toFixed(2)} {order.currency}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      order.paymentMethod === "WIRE_TRANSFER"
                        ? "bg-amber-100 text-amber-700"
                        : order.paymentMethod === "MAKSEKESKUS"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.paymentMethod === "WIRE_TRANSFER"
                      ? "Wire Transfer"
                      : order.paymentMethod === "MAKSEKESKUS"
                        ? "Maksekeskus"
                        : "Stripe"}
                  </span>
                  {order.customerType === "BUSINESS" && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                      Business
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {orders.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-sm text-zinc-500">
          No orders in this view.
        </p>
      )}
    </div>
  );
}
