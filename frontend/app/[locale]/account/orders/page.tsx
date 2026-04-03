import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import { OrderTimeline } from "@/app/account/order-timeline";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/account/profile`);
  }

  const [orders, translations] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" }, take: 1 },
              },
            },
          },
        },
      },
    }),
    getTranslations(locale),
  ]);
  const t = createT(translations);

  return (
    <div className="space-y-6 max-lg:pb-2">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          {t("account.myOrders")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("account.ordersPlacedWith", { email: user.email })}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="mobile-sheet rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm lg:rounded-2xl">
          <p className="text-sm text-gray-600">
            {t("account.noOrdersYet")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="mobile-sheet overflow-hidden rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:rounded-2xl lg:border-gray-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {t("account.order")} {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("account.placed")}{" "}
                    {order.createdAt.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">{t("account.status")}</p>
                  <span className="mt-1 inline-block rounded-full border border-black/10 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
                    {order.status}
                  </span>
                </div>
              </div>

              <OrderTimeline
                createdAt={order.createdAt.toISOString()}
                dpdLabelCreatedAt={order.dpdLabelCreatedAt?.toISOString() ?? null}
                dpdSentAt={order.dpdSentAt?.toISOString() ?? null}
                dpdDeliveredAt={order.dpdDeliveredAt?.toISOString() ?? null}
                dpdLastStatus={order.dpdLastStatus ?? null}
              />

              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                        {item.product?.images?.[0] ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].altText ?? item.product.name ?? ""}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">
                          {item.product?.name ?? t("common.product")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t("account.qty")} {item.quantity}
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
                <p className="text-gray-600">{t("account.total")}</p>
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
