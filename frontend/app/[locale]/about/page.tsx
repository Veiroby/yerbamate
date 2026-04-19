import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { isValidLocale, getTranslations, createT } from "@/lib/i18n";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

const baseUrl = "https://www.yerbatea.lv";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const locale = localeParam as "lv" | "en";

  const translations = await getTranslations(locale);
  const t = createT(translations);

  const title = `${t("about.title")} – YerbaTea`;
  const description = t("about.intro");
  const canonical = `${baseUrl}/${locale}/about`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv/about`,
        en: `${baseUrl}/en/about`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const [user, translations] = await Promise.all([
    getCurrentUser(),
    getTranslations(locale),
  ]);
  const t = createT(translations);
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <SiteHeader user={user ? { isAdmin: hasAdminAccess(user) } : null} locale={locale} />

      <main className="mx-auto w-full max-w-3xl px-3 py-16 max-lg:max-w-none sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-black sm:text-4xl">
          {t("about.title")}
        </h1>
        <div className="prose prose-neutral max-w-none">
          <p className="leading-relaxed text-neutral-600">
            {t("about.intro")}
          </p>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
