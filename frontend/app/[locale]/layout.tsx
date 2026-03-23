import { notFound } from "next/navigation";
import { getTranslations } from "@/lib/i18n";
import { TranslationProvider } from "@/lib/translation-context";
import { NewsletterPopup } from "@/app/components/newsletter-popup";
import type { Locale } from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale = (localeParam === "lv" || localeParam === "en" ? localeParam : null) as Locale | null;
  if (!locale) notFound();

  const translations = await getTranslations(locale);

  return (
    <TranslationProvider locale={locale} translations={translations}>
      {children}
      <NewsletterPopup />
    </TranslationProvider>
  );
}
