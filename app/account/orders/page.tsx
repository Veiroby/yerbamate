import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";

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
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader user={{ isAdmin: user.isAdmin }} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Order history
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Orders placed with {user.email}.
            </p>
          </div>
          <Link
            href="/account/profile"
            className="text-sm font-medium text-zinc-600 hover:text-emerald-700"
          >
            Account
          </Link>
        </header>

        {orders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-zinc-500">
            No orders yet. Orders placed as a guest with this email will appear
            here automatically.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Order {order.orderNumber}
                    </p>
                    <p className="text-sm text-zinc-600">
                      Placed{" "}
                      {order.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-zinc-500">
                      Status
                    </p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {order.status}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-100" />
                        <div>
                          <p className="text-xs font-medium text-zinc-900">
                            {item.product?.name ?? "Product"}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Qty {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-zinc-900">
                        {(item.total as unknown as number).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-2 text-sm">
                  <p className="text-zinc-600">Total</p>
                  <p className="font-semibold text-zinc-900">
                    {order.currency} {(order.total as unknown as number).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

