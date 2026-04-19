"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { OrderStatus } from "@/app/generated/prisma/client";
import { deleteOrder, setOrderArchived, updateOrderStatus } from "../actions";

type Props = {
  orderId: string;
  status: OrderStatus;
  archived: boolean;
};

export function OrderDetailActions({ orderId, status, archived }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action={async (fd) => {
          await updateOrderStatus(orderId, fd);
          router.refresh();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <select
          name="status"
          defaultValue={status}
          className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs"
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
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Update status
        </button>
      </form>

      {!archived ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await setOrderArchived(orderId, true);
              router.refresh();
            });
          }}
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        >
          Archive
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await setOrderArchived(orderId, false);
              router.refresh();
            });
          }}
          className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
        >
          Unarchive
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this order permanently?")) return;
          startTransition(async () => {
            await deleteOrder(orderId);
            router.push("/admin/orders");
            router.refresh();
          });
        }}
        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
