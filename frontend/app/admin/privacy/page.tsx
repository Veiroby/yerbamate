import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "@/lib/locale";
import { getTranslations, createT } from "@/lib/i18n";
import { getPolicyContent, upsertPolicyContent, type PolicySlug } from "@/lib/policies";

const POLICY_SLUGS: { slug: PolicySlug; label: string; titleKey: string; contentKey: string }[] = [
  { slug: "privacy", label: "Privacy policy", titleKey: "privacy.title", contentKey: "privacy.fullText" },
  { slug: "terms", label: "Terms & conditions", titleKey: "terms.title", contentKey: "terms.fullText" },
  { slug: "shipping", label: "Shipping & returns", titleKey: "shipping.title", contentKey: "shipping.fullText" },
];

async function savePolicy(formData: FormData) {
  "use server";

  const slug = formData.get("slug") as PolicySlug;
  const locale = formData.get("locale") as Locale;
  const title = (formData.get("title") as string) || "";
  const content = (formData.get("content") as string) || "";

  if (!slug || !locale) return;

  await upsertPolicyContent(slug, locale, { title, content });

  revalidatePath(`/admin/privacy`);
  revalidatePath(`/${locale}/${slug === "shipping" ? "shipping-policy" : slug === "terms" ? "terms" : "privacy"}`);
}

export default async function AdminPrivacyPoliciesPage() {
  const forms = [];

  for (const locale of LOCALES) {
    const tr = await getTranslations(locale);
    const t = createT(tr);

    for (const def of POLICY_SLUGS) {
      const defaults = {
        title: t(def.titleKey),
        content: t(def.contentKey),
      };

      const current = await getPolicyContent(def.slug, locale, defaults);

      forms.push({
        locale,
        slug: def.slug,
        label: def.label,
        title: current.title,
        content: current.content,
      });
    }
  }

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

      <div className="space-y-6">
        {forms.map((form) => (
          <div
            key={`${form.slug}-${form.locale}`}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  {form.locale.toUpperCase()}
                </p>
                <h2 className="text-sm font-semibold text-stone-900">
                  {form.label}
                </h2>
              </div>
            </div>

            <form action={savePolicy} className="space-y-3">
              <input type="hidden" name="slug" value={form.slug} />
              <input type="hidden" name="locale" value={form.locale} />

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Title
                </label>
                <input
                  name="title"
                  defaultValue={form.title}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Body text
                </label>
                <textarea
                  name="content"
                  defaultValue={form.content}
                  rows={10}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-stone-500">
                  Plain text only. Line breaks will be preserved on the public pages.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
