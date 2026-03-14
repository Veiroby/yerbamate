import { prisma } from "@/lib/db";

export default async function AdminSettingsPage() {
  const storeName = "YerbaMate Store";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Store and account preferences.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">
          Store information
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Store name and basic details (editable in a future release).
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Store name</dt>
            <dd className="font-medium text-zinc-900">{storeName}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Integrations</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Payment and shipping are configured via environment variables.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600">
          <li>• Stripe (payments)</li>
          <li>• Internal shipping rules (zones & methods)</li>
        </ul>
      </section>
    </div>
  );
}
