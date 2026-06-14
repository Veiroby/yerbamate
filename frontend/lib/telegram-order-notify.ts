/**
 * Push new-order alerts to Telegram (Roberts bot / owner chat).
 * Set TELEGRAM_BOT_TOKEN + TELEGRAM_ORDER_NOTIFY_CHAT_IDS in frontend/.env.
 */

export type TelegramOrderNotifyInput = {
  orderNumber: string;
  status: string;
  email: string;
  total: number | string;
  currency: string;
  paymentMethod?: string | null;
  headline?: string;
  items?: Array<{ quantity: number; productName?: string | null }>;
  shipping?: {
    city?: string | null;
    dpdPickupPointName?: string | null;
  } | null;
};

function formatMessage(order: TelegramOrderNotifyInput): string {
  const ship = order.shipping;
  const dest =
    ship?.dpdPickupPointName || ship?.city || "";
  const lines = [
    order.headline ?? "🛒 *New YerbaTea order*",
    "",
    `*${order.orderNumber}* — ${order.status}`,
    `${order.total} ${order.currency} — ${order.email}`,
  ];
  if (order.paymentMethod) {
    lines.push(`Payment: ${order.paymentMethod.replace(/_/g, " ")}`);
  }
  if (dest) {
    lines.push(`Ship: ${dest}`);
  }
  const itemLines = (order.items ?? [])
    .slice(0, 6)
    .map((it) => `• ${it.quantity}× ${it.productName ?? "Item"}`);
  if (itemLines.length) {
    lines.push("", ...itemLines);
  }
  lines.push("", `_In Roberts: /order ${order.orderNumber} or /dpd ${order.orderNumber}_`);
  return lines.join("\n");
}

export async function notifyTelegramNewOrder(
  order: TelegramOrderNotifyInput,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const rawIds =
    process.env.TELEGRAM_ORDER_NOTIFY_CHAT_IDS?.trim() ||
    process.env.TELEGRAM_OWNER_CHAT_ID?.trim();
  if (!token || !rawIds) {
    return;
  }

  const chatIds = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!chatIds.length) return;

  const text = formatMessage(order);
  for (const chatId of chatIds) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        console.error(
          "[telegram-order-notify] send failed",
          chatId,
          res.status,
          body.slice(0, 200),
        );
      }
    } catch (err) {
      console.error("[telegram-order-notify] error", chatId, err);
    }
  }
}
