import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { AdminPage } from "../components/ui/admin-page";
import { AdminOrdersLive } from "./orders-live";
import { loadAdminOrders, parseOrderView } from "./load-orders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  noStore();
  const sp = await searchParams;
  const view = parseOrderView(sp.view);
  const query = sp.q ?? "";
  const orders = await loadAdminOrders(view, query);
  const archived = view === "archived";

  return (
    <AdminPage
      title="Orders"
      subtitle={
        archived
          ? "Archived orders stay here until you restore them."
          : "New orders stay in this list after they are shipped. Archive one when you are done with it."
      }
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading orders…</p>}>
        <AdminOrdersLive key={`${view}|${query}`} initial={orders} />
      </Suspense>
    </AdminPage>
  );
}
