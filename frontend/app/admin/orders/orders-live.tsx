"use client";

import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminOrdersRefreshContext } from "../admin-frame";
import { AdminCard } from "../components/ui/admin-page";
import { AdminTabs, type AdminTab } from "../components/ui/admin-tabs";
import { AdminOrdersList, type AdminSerializedOrder } from "./orders-list";

type AdminOrderView = "all" | "unpaid" | "open" | "archived";

function parseOrderView(value: string | null): AdminOrderView {
  if (value === "unpaid" || value === "open" || value === "archived") return value;
  return "all";
}

type OrdersPayload = {
  view: AdminOrderView;
  query: string;
  orders: AdminSerializedOrder[];
  counts: { all: number; unpaid: number; open: number; archived: number };
};

export function AdminOrdersLive({ initial }: { initial: OrdersPayload }) {
  const refreshNonce = useContext(AdminOrdersRefreshContext);
  const searchParams = useSearchParams();
  const view = parseOrderView(searchParams.get("view"));
  const query = searchParams.get("q")?.trim() ?? "";
  const [data, setData] = useState<OrdersPayload>(initial);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    const onReload = () => setReloadTick((value) => value + 1);
    window.addEventListener("admin-orders-reload", onReload);
    return () => window.removeEventListener("admin-orders-reload", onReload);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const params = new URLSearchParams();
        if (view !== "all") params.set("view", view);
        if (query) params.set("q", query);
        params.set("_", String(Date.now()));
        const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
        if (cancelled || !response.ok) return;
        const next = (await response.json()) as OrdersPayload;
        if (!cancelled && Array.isArray(next.orders)) setData(next);
      } catch {
        // Keep the orders already rendered.
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [view, query, refreshNonce, reloadTick]);

  const current = data.view === view && data.query === query ? data : initial;

  const archived = current.view === "archived";
  const tabs: AdminTab[] = [
    { id: "all", label: "All", href: "/admin/orders", count: current.counts.all },
    { id: "unpaid", label: "Unpaid", href: "/admin/orders?view=unpaid", count: current.counts.unpaid },
    { id: "open", label: "Open", href: "/admin/orders?view=open", count: current.counts.open },
    { id: "archived", label: "Archived", href: "/admin/orders?view=archived", count: current.counts.archived },
  ];

  return (
    <>
      <AdminTabs tabs={tabs} activeId={current.view} />
      <AdminCard
        title={archived ? "Archived orders" : "All orders"}
        subtitle={
          current.query
            ? `Showing results for “${current.query}”`
            : `${current.orders.length} order${current.orders.length === 1 ? "" : "s"}`
        }
        flush
      >
        <div className="p-4 sm:p-5">
          <AdminOrdersList orders={current.orders} />
        </div>
      </AdminCard>
    </>
  );
}
