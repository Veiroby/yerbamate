import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/locale";

const POLICY_SLUGS = [
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms & conditions" },
  { slug: "shipping", label: "Shipping & returns" },
] as const;

type PolicyRow = {
  id: string;
  slug: string;
  locale: Locale;
  title: string;
  content: string;
  updatedAt: Date;
};

export default async function AdminPrivacyPoliciesPage() {
  const policies = await prisma.policy.findMany({
    orderBy: [{ slug: "asc" }, { locale: "asc" }],
  });

  const rows: PolicyRow[] = policies.map((p) => ({
    id: p.id,
    slug: p.slug,
    locale: p.locale as Locale,
    title: p.title,
    content: p.content,
    updatedAt: p.updatedAt,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Privacy & Policies
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Edit the text for your public-facing policies. Changes here override the default copy from translation files.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-3">
          Existing policies
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-stone-500">
            No policy overrides yet. They will appear here once you save content for a locale.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="pb-3 font-medium text-stone-600">Policy</th>
                  <th className="pb-3 font-medium text-stone-600">Locale</th>
                  <th className="pb-3 font-medium text-stone-600">Title</th>
                  <th className="pb-3 font-medium text-stone-600">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row) => {
                  const def = POLICY_SLUGS.find((p) => p.slug === row.slug);
                  return (
                    <tr key={row.id}>
                      <td className="py-2.5 pr-4 text-stone-900">
                        {def?.label ?? row.slug}
                      </td>
                      <td className="py-2.5 pr-4 text-stone-600 uppercase">
                        {row.locale}
                      </td>
                      <td className="py-2.5 pr-4 text-stone-900">
                        {row.title}
                      </td>
                      <td className="py-2.5 pr-4 text-stone-500">
                        {row.updatedAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-stone-500">
        Note: A follow-up step will add editing forms here so you can change titles and content per policy and locale.
      </p>
    </div>
  );
}

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default function AdminPrivacyPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Privacy policy
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Edit and publish your store’s privacy policy. This content can be
          shown on a public /privacy page.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form
          action={async (formData) => {
            "use server";
            // Placeholder: persist privacy policy (e.g. in DB or CMS) in a future release
            revalidatePath("/admin/privacy");
            redirect("/admin/privacy?saved=1");
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Privacy policy (HTML or plain text)
            </label>
            <textarea
              name="content"
              rows={16}
              placeholder="Enter your privacy policy content here. You can use plain text or HTML. Saving will be wired to storage in a future release."
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save privacy policy
          </button>
        </form>
        <p className="mt-3 text-xs text-zinc-500">
          Tip: Add a link to /privacy in your store footer so customers can
          view this policy.
        </p>
      </section>
    </div>
  );
}
