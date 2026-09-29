import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { AdminPage } from "../components/ui/admin-page";
import { AdminOrdersLive } from "./orders-live";
import { parseOrderView } from "./load-orders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  noStore();
  const { view: viewParam } = await searchParams;
  const archived = parseOrderView(viewParam) === "archived";

  return (
    <AdminPage
      title="Orders"
      subtitle={
        archived
          ? "Shipped orders auto-archive. Unarchive anytime."
          : "New orders from the last 7 days are highlighted."
      }
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading orders…</p>}>
        <AdminOrdersLive />
      </Suspense>
    </AdminPage>
  );
}
