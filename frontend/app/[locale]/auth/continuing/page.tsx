import { redirect } from "next/navigation";
import { getTranslations, createT, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { AuthContinuingClient } from "./auth-continuing-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AuthContinuingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) {
    redirect("/");
  }
  const locale = raw as Locale;
  const translations = await getTranslations(locale);
  const t = createT(translations);
  const message = t("account.authContinuingPhase1");

  return <AuthContinuingClient locale={locale} message={message} />;
}
