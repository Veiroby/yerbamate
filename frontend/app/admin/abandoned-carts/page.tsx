import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getAbandonedCartSettings } from "@/lib/abandoned-cart";
import {
  saveAbandonedCartSettingsAction,
  sendAbandonedReminderAction,
  sendAbandonedReminderBulkAction,
} from "./actions";

function asBoolean(v?: string) {
  return v === "1" || v === "true" || v === "yes";
}

function formatDuration(from: Date) {
  const ms = Date.now() - from.getTime();
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default async function AdminAbandonedCartsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sent?: string;
    recovered?: string;
    days?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const sentFilter = params.sent?.trim() ?? "";
  const recoveredFilter = params.recovered?.trim() ?? "";
  const days = Math.max(1, Math.min(180, Number(params.days ?? "30") || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const settings = await getAbandonedCartSettings();

  const rows = await prisma.abandonedCartRecovery.findMany({
    where: {
      createdAt: { gte: since },
      ...(status ? { status: status as any } : {}),
      ...(recoveredFilter
        ? recoveredFilter === "yes"
          ? { status: "RECOVERED" }
          : { status: { not: "RECOVERED" } }
        : {}),
      ...(sentFilter
        ? sentFilter === "yes"
          ? { reminderCount: { gt: 0 } }
          : { reminderCount: 0 }
        : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { cartId: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      cart: {
        include: {
          items: {
            include: {
              product: { select: { name: true, currency: true } },
            },
          },
        },
      },
      reminders: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Abandoned carts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Identify customers, send manual reminders, and monitor recovered carts.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Reminder settings</h2>
        <form action={saveAbandonedCartSettingsAction} className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="text-xs text-zinc-600">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mr-2" />
            Tracking enabled
          </label>
          <label className="text-xs text-zinc-600">
            <input
              type="checkbox"
              name="autoSendEnabled"
              defaultChecked={settings.autoSendEnabled}
              className="mr-2"
            />
            Auto reminders enabled
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Timeout (minutes)
            <input
              type="number"
              name="timeoutMinutes"
              min={10}
              defaultValue={settings.timeoutMinutes}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Cooldown (hours)
            <input
              type="number"
              name="cooldownHours"
              min={1}
              defaultValue={settings.cooldownHours}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            1st reminder delay (h)
            <input
              type="number"
              name="firstDelayHours"
              min={1}
              defaultValue={settings.firstDelayHours}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            2nd reminder delay (h)
            <input
              type="number"
              name="secondDelayHours"
              min={1}
              defaultValue={settings.secondDelayHours}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            3rd reminder delay (h)
            <input
              type="number"
              name="thirdDelayHours"
              min={1}
              defaultValue={settings.thirdDelayHours}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Sender name
            <input
              type="text"
              name="senderName"
              defaultValue={settings.senderName ?? ""}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Sender email
            <input
              type="email"
              name="senderEmail"
              defaultValue={settings.senderEmail ?? ""}
              className="rounded-lg border border-zinc-300 px-2 py-1"
            />
          </label>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save settings
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-6" method="get">
          <input
            type="text"
            name="q"
            placeholder="Search by cart id, email, name"
            defaultValue={q}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="ABANDONED">Abandoned</option>
            <option value="RECOVERED">Recovered</option>
            <option value="CONVERTED">Converted</option>
          </select>
          <select name="sent" defaultValue={sentFilter} className="rounded-lg border border-zinc-300 px-2 py-2 text-sm">
            <option value="">Reminder sent: any</option>
            <option value="yes">Sent</option>
            <option value="no">Not sent</option>
          </select>
          <select
            name="recovered"
            defaultValue={recoveredFilter}
            className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
          >
            <option value="">Recovered: any</option>
            <option value="yes">Recovered</option>
            <option value="no">Not recovered</option>
          </select>
          <input
            type="number"
            name="days"
            min={1}
            max={180}
            defaultValue={days}
            className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
          />
          <div className="md:col-span-6">
            <button
              type="submit"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No abandoned cart rows match the filters.</p>
        ) : (
          <form action={sendAbandonedReminderBulkAction}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700">{rows.length} carts</p>
              <button
                type="submit"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Send reminders to selected
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2">Cart</th>
                    <th className="px-2 py-2">Customer</th>
                    <th className="px-2 py-2">Items / value</th>
                    <th className="px-2 py-2">Last activity</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Reminders</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const value = row.cart.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
                    const currency = row.cart.items[0]?.product?.currency ?? "EUR";
                    const customerName = row.customerName ?? row.user?.name ?? "—";
                    const customerEmail = row.email ?? row.user?.email ?? "—";
                    const canSend = Boolean(customerEmail !== "—" && !["CONVERTED"].includes(row.status));
                    const reminderStage = row.lastReminderStage ?? "—";
                    const sentLast = row.lastReminderSentAt
                      ? row.lastReminderSentAt.toLocaleString()
                      : "Never";
                    return (
                      <tr key={row.id} className="border-b border-zinc-100 align-top">
                        <td className="px-2 py-3">
                          <input type="checkbox" name="recoveryIds" value={row.id} disabled={!canSend} />
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-mono text-xs text-zinc-700">{row.cartId}</p>
                          <p className="text-xs text-zinc-500">{row.id}</p>
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-medium text-zinc-900">{customerName}</p>
                          <p className="text-zinc-600">{customerEmail}</p>
                          <p className="text-xs text-zinc-500">{row.isGuest ? "Guest" : "Registered"}</p>
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-medium text-zinc-900">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)}
                          </p>
                          <p className="text-xs text-zinc-500">{row.cart.items.length} items</p>
                          <ul className="mt-1 text-xs text-zinc-600">
                            {row.cart.items.slice(0, 2).map((item) => (
                              <li key={item.id}>{item.product?.name ?? "Product"} x {item.quantity}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-2 py-3 text-xs text-zinc-600">
                          <p>{row.lastActivityAt.toLocaleString()}</p>
                          <p className="text-zinc-500">{formatDuration(row.lastActivityAt)} ago</p>
                        </td>
                        <td className="px-2 py-3">
                          <span className="rounded-full border border-zinc-300 px-2 py-1 text-xs">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-zinc-600">
                          <p>Count: {row.reminderCount}</p>
                          <p>Last stage: {reminderStage}</p>
                          <p>Last sent: {sentLast}</p>
                        </td>
                        <td className="px-2 py-3">
                          {canSend ? (
                            <form action={sendAbandonedReminderAction}>
                              <input type="hidden" name="recoveryId" value={row.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                              >
                                Send reminder
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-zinc-400">Not eligible</span>
                          )}
                          {row.recoveryToken ? (
                            <Link
                              href={`/api/cart/recover/${row.recoveryToken}`}
                              target="_blank"
                              className="mt-2 block text-xs text-zinc-500 hover:underline"
                            >
                              Recovery link
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
