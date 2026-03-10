import { prisma } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";

export default async function AdminEmailPage() {
  const [subscriberCount, resendConfigured] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    Promise.resolve(isEmailConfigured()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Email marketing
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Newsletter, order confirmation & abandoned cart (Resend)
        </p>
      </div>

      {!resendConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Resend not configured.</strong> Set{" "}
          <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> and{" "}
          <code className="rounded bg-amber-100 px-1">RESEND_FROM</code> to send
          order confirmation and abandoned cart emails. Get keys at{" "}
          <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline">
            resend.com
          </a>
          .
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Newsletter
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {subscriberCount}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Synced to Resend Contacts (optional segment)
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Order confirmation
          </p>
          <p className="mt-1 text-lg font-medium text-zinc-900">Automatic</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sent when Stripe marks order PAID
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Abandoned cart
          </p>
          <p className="mt-1 text-lg font-medium text-zinc-900">Cron job</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Call <code className="rounded bg-zinc-100 px-1">/api/cron/abandoned-cart</code> daily
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Setup</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-600">
          <li>
            <strong>Resend (transactional):</strong> Set <code>RESEND_API_KEY</code> and <code>RESEND_FROM</code> for order confirmation and abandoned cart emails. Optional <code>RESEND_SEGMENT_ID</code> to also sync signups to a Resend segment.
          </li>
          <li>
            <strong>Abandoned cart:</strong> Set <code>CRON_SECRET</code> and call <code>GET /api/cron/abandoned-cart</code> daily with <code>Authorization: Bearer &lt;CRON_SECRET&gt;</code>.
          </li>
        </ul>
      </section>

      {subscriberCount > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Recent subscribers</h2>
          <div className="mt-3 overflow-hidden">
            <SubscriberList />
          </div>
        </section>
      )}
    </div>
  );
}

async function SubscriberList() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (subscribers.length === 0) return null;
  return (
    <ul className="divide-y divide-zinc-100">
      {subscribers.map((s) => (
        <li key={s.id} className="flex items-center justify-between py-2 text-sm">
          <span className="text-zinc-900">{s.email}</span>
          <span className="text-zinc-500">
            {s.createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
