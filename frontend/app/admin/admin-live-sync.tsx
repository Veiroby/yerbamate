"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notice = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
};

type LiveState = {
  unread: number;
  latestNotificationId: string | null;
  ordersUpdatedAt: string | null;
  inventoryUpdatedAt: string | null;
  notifications: Notice[];
};

function signature(data: LiveState) {
  return [
    data.unread,
    data.latestNotificationId,
    data.ordersUpdatedAt,
    data.inventoryUpdatedAt,
  ].join("|");
}

export function AdminLiveSync() {
  const router = useRouter();
  const [data, setData] = useState<LiveState | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = "";
    let cancelled = false;

    async function tick() {
      if (document.visibilityState === "hidden") return;
      const response = await fetch("/api/admin/live", { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const next = (await response.json()) as LiveState;
      const nextSignature = signature(next);
      if (seen && seen !== nextSignature) {
        router.refresh();
      }
      seen = nextSignature;
      setData(next);
    }

    void tick();
    const timer = window.setInterval(() => void tick(), 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  async function markRead(id?: string) {
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    setData((current) => {
      if (!current) return current;
      const notifications = id
        ? current.notifications.filter((note) => note.id !== id)
        : [];
      return {
        ...current,
        unread: notifications.length,
        latestNotificationId: notifications[0]?.id ?? null,
        notifications,
      };
    });
    router.refresh();
  }

  const unread = data?.unread ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-[var(--admin-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)]"
        aria-expanded={open}
      >
        Updates{unread > 0 ? ` (${unread})` : ""}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 shadow-none">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-medium text-[var(--admin-text-secondary)]">Order updates</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markRead()}
                className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
              >
                Mark read
              </button>
            ) : null}
          </div>
          {unread === 0 ? (
            <p className="px-1 py-3 text-xs text-[var(--admin-text-secondary)]">No new order updates.</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-auto">
              {data?.notifications.map((note) => (
                <li key={note.id}>
                  <Link
                    href={note.href ?? "/admin/orders"}
                    onClick={() => void markRead(note.id)}
                    className="block rounded-md px-2 py-1.5 hover:bg-[var(--admin-surface-hover)]"
                  >
                    <p className="text-sm font-medium text-[var(--admin-text)]">{note.title}</p>
                    <p className="text-xs text-[var(--admin-text-secondary)]">{note.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
