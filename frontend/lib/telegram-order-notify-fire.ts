import {
  notifyTelegramNewOrder,
  type TelegramOrderNotifyInput,
} from "@/lib/telegram-order-notify";

type OrderRow = {
  orderNumber: string;
  status: string;
  email: string;
  total: { toString(): string } | number;
  currency: string;
  paymentMethod?: string | null;
  shippingAddress?: unknown;
  items?: Array<{
    quantity: number;
    product?: { name: string } | null;
  }>;
};

/** Fire-and-forget Telegram alert; never blocks checkout. */
export function fireTelegramOrderNotify(
  order: OrderRow,
  options?: { headline?: string },
): void {
  const shipping = order.shippingAddress as TelegramOrderNotifyInput["shipping"];
  void notifyTelegramNewOrder({
    orderNumber: order.orderNumber,
    status: order.status,
    email: order.email,
    total: Number(order.total),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    headline: options?.headline,
    shipping: shipping ?? null,
    items: order.items?.map((it) => ({
      quantity: it.quantity,
      productName: it.product?.name ?? null,
    })),
  }).catch((err) => console.error("[telegram-order-notify]", err));
}
