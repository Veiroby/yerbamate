"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";
import {
  isEmailConfigured,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendUnpaidOrderReminderEmail,
} from "@/lib/email";

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const user = await requireAdminWrite();
  const status = formData.get("status")?.toString() as OrderStatus | undefined;
  if (!status) return;

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, shippedEmailSentAt: true },
  });
  if (!existing) return;

  const transitionToShipped =
    status === "SHIPPED" && existing.status !== "SHIPPED";

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(transitionToShipped ? { archived: true } : {}),
    },
    include: {
      items: { include: { product: true } },
    },
  });

  await writeAuditLog(user.id, "order.status_changed", "Order", orderId, {
    from: existing.status,
    to: status,
  });

  if (
    status === "PAID" &&
    isEmailConfigured() &&
    updated.customerType !== "BUSINESS" &&
    !updated.confirmationEmailSentAt
  ) {
    const result = await sendOrderConfirmationEmail({
      orderId: updated.id,
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
      customerType: updated.customerType,
      companyName: updated.companyName ?? undefined,
      companyAddress: updated.companyAddress ?? undefined,
      vatNumber: updated.vatNumber ?? undefined,
      phone: updated.phone ?? undefined,
    });

    if (result.ok) {
      await prisma.order.update({
        where: { id: updated.id },
        data: { confirmationEmailSentAt: new Date() },
      });
    }
  }

  if (
    transitionToShipped &&
    isEmailConfigured() &&
    updated.customerType !== "BUSINESS" &&
    !existing.shippedEmailSentAt
  ) {
    const result = await sendOrderShippedEmail({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      email: updated.email,
      total: Number(updated.total),
      currency: updated.currency,
      subtotal: updated.subtotal,
      shippingCost: updated.shippingCost,
      tax: updated.tax,
      shippingAddress: updated.shippingAddress,
      items: updated.items,
      dpdTrackingNumber: updated.dpdTrackingNumber,
      companyName: updated.companyName ?? undefined,
    });

    if (result.ok) {
      await prisma.order.update({
        where: { id: updated.id },
        data: { shippedEmailSentAt: new Date() },
      });
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function setOrderArchived(orderId: string, archived: boolean) {
  const user = await requireAdminWrite();
  await prisma.order.update({
    where: { id: orderId },
    data: { archived },
  });
  await writeAuditLog(user.id, archived ? "order.archived" : "order.unarchived", "Order", orderId, {
    archived,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function deleteOrder(orderId: string) {
  const user = await requireAdminWrite();
  await prisma.order.delete({
    where: { id: orderId },
  });
  await writeAuditLog(user.id, "order.deleted", "Order", orderId, {});
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function addOrderAdminNote(orderId: string, formData: FormData) {
  const user = await requireAdminWrite();
  const body = formData.get("body")?.toString().trim();
  if (!body) return;

  await prisma.orderAdminNote.create({
    data: {
      orderId,
      authorId: user.id,
      body,
    },
  });
  await writeAuditLog(user.id, "order.note_added", "Order", orderId, { preview: body.slice(0, 120) });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function sendUnpaidOrderReminder(orderId: string) {
  const user = await requireAdminWrite();
  if (!isEmailConfigured()) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      total: true,
      currency: true,
      status: true,
      paymentMethod: true,
    },
  });
  if (!order) return;
  if (!["PENDING", "REQUIRES_PAYMENT"].includes(order.status)) return;

  const result = await sendUnpaidOrderReminderEmail({
    orderNumber: order.orderNumber,
    email: order.email,
    total: Number(order.total),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
  });

  await writeAuditLog(user.id, "order.unpaid_reminder_sent", "Order", orderId, {
    status: order.status,
    paymentMethod: order.paymentMethod,
    success: result.ok,
    error: result.ok ? null : result.error,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
