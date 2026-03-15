import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/account/profile");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
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
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          My Orders
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Orders placed with {user.email}.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            No orders yet. Orders placed as a guest with this email will appear
            here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Order {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    Placed{" "}
                    {order.createdAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <p className="text-sm font-semibold text-black">
                    {order.status}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-100" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">
                          {item.product?.name ?? "Product"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-black">
                      {(item.total as unknown as number).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <p className="text-gray-600">Total</p>
                <p className="font-semibold text-black">
                  {order.currency}{" "}
                  {(order.total as unknown as number).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
