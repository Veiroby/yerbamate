import { prisma } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { EmailCampaignForm } from "./email-campaign-form";
import { NewArrivalsEmailForm } from "./new-arrivals-email-form";
import { PopupSettingsForm } from "./popup-settings-form";

export default async function AdminEmailPage() {
  const [subscriberCount, userCount, resendConfigured, subscribers, users, settings, campaigns] =
    await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.user.count(),
      Promise.resolve(isEmailConfigured()),
      prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.user.findMany({
        where: { email: { not: undefined } },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.emailCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const defaultSettings = {
    popupEnabled: true,
    popupDelaySeconds: 10,
    popupTitle: "Join YerbaTea Community",
    popupDescription: "Subscribe to our newsletter and get an exclusive discount on your first order!",
    popupDiscountCode: "",
    popupDiscountPercent: 10,
  };

  const popupSettings = settings || defaultSettings;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Email marketing
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Newsletter, campaigns & subscription popup settings
        </p>
      </div>

      {!resendConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Resend not configured.</strong> Set{" "}
          <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> and{" "}
          <code className="rounded bg-amber-100 px-1">RESEND_FROM</code> to send
          emails. Get keys at{" "}
          <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline">
            resend.com
          </a>
          .
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Newsletter Subscribers
          </p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {subscriberCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Registered Users
          </p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {userCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Campaigns Sent
          </p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {campaigns.filter(c => c.sentAt).length}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Popup Status
          </p>
          <p className={`mt-1 text-lg font-semibold ${popupSettings.popupEnabled ? 'text-teal-600' : 'text-stone-400'}`}>
            {popupSettings.popupEnabled ? 'Active' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* Popup Settings */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Newsletter Popup Settings</h2>
        <p className="mb-4 text-sm text-stone-600">
          Configure the email subscription popup that appears to new visitors.
        </p>
        <PopupSettingsForm initialSettings={{
          popupEnabled: popupSettings.popupEnabled,
          popupDelaySeconds: popupSettings.popupDelaySeconds,
          popupTitle: popupSettings.popupTitle,
          popupDescription: popupSettings.popupDescription,
          popupDiscountCode: popupSettings.popupDiscountCode || "",
          popupDiscountPercent: popupSettings.popupDiscountPercent,
        }} />
      </section>

      {/* Create Campaign */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Create Email Campaign</h2>
        <p className="mb-4 text-sm text-stone-600">
          Select recipients and compose a custom email to send.
        </p>
        <div className="mb-8">
          <NewArrivalsEmailForm
            subscriberTotal={subscriberCount}
            resendConfigured={resendConfigured}
          />
        </div>
        <EmailCampaignForm
          subscribers={subscribers.map((s) => ({ email: s.email, type: "subscriber" as const }))}
          users={users.map((u) => ({ email: u.email, name: u.name, type: "user" as const }))}
          subscriberTotal={subscriberCount}
          userTotal={userCount}
          resendConfigured={resendConfigured}
        />
      </section>

      {/* Recent Campaigns */}
      {campaigns.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Recent Campaigns</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="pb-3 font-medium text-stone-600">Name</th>
                  <th className="pb-3 font-medium text-stone-600">Subject</th>
                  <th className="pb-3 font-medium text-stone-600">Sent</th>
                  <th className="pb-3 font-medium text-stone-600">Recipients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="py-3 text-stone-900">{campaign.name}</td>
                    <td className="py-3 text-stone-600">{campaign.subject}</td>
                    <td className="py-3 text-stone-500">
                      {campaign.sentAt 
                        ? campaign.sentAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : <span className="text-amber-600">Draft</span>
                      }
                    </td>
                    <td className="py-3 text-stone-500">{campaign.sentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Subscribers List */}
      {subscriberCount > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Newsletter Subscribers</h2>
          <div className="max-h-64 overflow-y-auto">
            <ul className="divide-y divide-stone-100">
              {subscribers.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-stone-900">{s.email}</span>
                  <span className="text-stone-500">
                    {s.createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
