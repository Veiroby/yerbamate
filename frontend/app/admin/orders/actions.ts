"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured, sendOrderConfirmationEmail } from "@/lib/email";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = formData.get("status")?.toString() as OrderStatus | undefined;
  if (!status) return;

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
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

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function setOrderArchived(orderId: string, archived: boolean) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { archived },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function deleteOrder(orderId: string) {
  await requireAdmin();
  await prisma.order.delete({
    where: { id: orderId },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
