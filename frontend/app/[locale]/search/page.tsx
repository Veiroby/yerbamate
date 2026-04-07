import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import { SiteHeader } from "@/app/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { FullSearchPage } from "@/app/components/mobile/full-search-page";
import type { Locale } from "@/lib/i18n";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const t = createT(await getTranslations(locale));
  return {
    title: `${t("nav.search")} – YerbaTea`,
  };
}

export default async function SearchRoutePage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return null;
  const locale = localeParam as Locale;
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />
      <FullSearchPage locale={locale} />
    </div>
  );
}
