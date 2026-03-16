import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { SiteFooter } from "@/app/components/site-footer";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Privacy policy – YerbaTea",
  description: "Privacy policy for YerbaTea.",
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  const translations = await getTranslations(locale);
  const t = createT(translations);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#283618]">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <div className="mb-6 text-xs uppercase tracking-wide text-[#606C38]">
          <span className="opacity-70">{t("common.home")}</span>
          <span className="mx-1.5 opacity-50">/</span>
          <span className="font-semibold">{t("privacy.title")}</span>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-[#FEFAE0] px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <h1 className="mb-4 text-2xl font-bold uppercase tracking-tight text-[#283618] sm:text-3xl">
            {t("privacy.title")}
          </h1>
          <p className="mb-6 text-sm text-[#606C38]">{t("privacy.intro")}</p>
          <div className="prose max-w-none text-sm prose-p:text-[#606C38] prose-headings:text-[#283618]">

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("privacy.dataController")}</h2>
          <p className="mt-2 text-[#606C38]">{t("privacy.dataControllerContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("privacy.purposes")}</h2>
          <p className="mt-2 text-[#606C38]">{t("privacy.purposesContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("privacy.recipients")}</h2>
          <p className="mt-2 text-[#606C38]">{t("privacy.recipientsContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("privacy.retention")}</h2>
          <p className="mt-2 text-[#606C38]">{t("privacy.retentionContent")}</p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("privacy.yourRights")}</h2>
          <p className="mt-2 text-[#606C38]">
            {t("privacy.yourRightsContent")}{" "}
            <a href="https://www.dvi.gov.lv/en" className="text-emerald-700 underline">www.dvi.gov.lv</a>.
          </p>

          <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-[#283618]">{t("privacy.children")}</h2>
          <p className="mt-2 text-[#606C38]">{t("privacy.childrenContent")}</p>

          <p className="mt-8 text-xs uppercase tracking-wide text-stone-500">
            {t("terms.lastUpdated")}:{" "}
            {new Date().toLocaleDateString(locale === "lv" ? "lv-LV" : "en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
