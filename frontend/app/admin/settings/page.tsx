import { AdminCard, AdminPage } from "../components/ui/admin-page";

export default async function AdminSettingsPage() {
  const storeName = "YerbaTea Store";

  return (
    <AdminPage
      title="Settings"
      subtitle="Manage your store and integrations."
      narrow
    >
      <AdminCard title="Store details">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-[var(--admin-border)] pb-3">
            <dt className="text-[var(--admin-text-secondary)]">Store name</dt>
            <dd className="font-medium text-[var(--admin-text)]">{storeName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--admin-text-secondary)]">Currency</dt>
            <dd className="font-medium text-[var(--admin-text)]">EUR</dd>
          </div>
        </dl>
      </AdminCard>

      <AdminCard title="Payments">
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between gap-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subdued)] px-4 py-3">
            <div>
              <p className="font-medium text-[var(--admin-text)]">Stripe</p>
              <p className="text-xs text-[var(--admin-text-secondary)]">
                Cards and checkout
              </p>
            </div>
            <span className="rounded-lg bg-[var(--admin-accent-subdued)] px-2 py-0.5 text-xs font-medium text-[var(--admin-accent-text)]">
              Active
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subdued)] px-4 py-3">
            <div>
              <p className="font-medium text-[var(--admin-text)]">MakeCommerce</p>
              <p className="text-xs text-[var(--admin-text-secondary)]">
                Bank links and local payments
              </p>
            </div>
            <span className="rounded-lg bg-[var(--admin-surface-subdued)] px-2 py-0.5 text-xs font-medium text-[var(--admin-text-secondary)] ring-1 ring-[var(--admin-border)]">
              Optional
            </span>
          </li>
        </ul>
      </AdminCard>

      <AdminCard title="Shipping and delivery">
        <p className="text-sm text-[var(--admin-text-secondary)]">
          Zones, rates, and carriers are configured under{" "}
          <a href="/admin/shipping" className="font-medium text-[var(--admin-accent)] hover:underline">
            Shipping and delivery
          </a>
          .
        </p>
      </AdminCard>
    </AdminPage>
  );
}
