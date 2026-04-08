import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { ContactForm } from "@/app/contact/contact-form";
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

  const title = `${t("contact.title")} – YerbaTea`;
  const description = t("contact.messagePrompt");
  const canonical = `${baseUrl}/${locale}/contact`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        lv: `${baseUrl}/lv/contact`,
        en: `${baseUrl}/en/contact`,
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

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const [user, translations] = await Promise.all([
    getCurrentUser(),
    getTranslations(locale),
  ]);
  const t = createT(translations);
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <SiteHeader user={user ? { isAdmin: user.isAdmin } : null} locale={locale} />

      <main className="mx-auto w-full max-w-3xl px-3 py-16 max-lg:max-w-none sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
          {t("contact.title")}
        </h1>
        <p className="mb-10 text-neutral-600">
          {t("contact.messagePrompt")}
        </p>
        <p className="mb-8 text-sm text-neutral-700">
          {t("contact.additionalInfo")}
        </p>
        <ContactForm />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
