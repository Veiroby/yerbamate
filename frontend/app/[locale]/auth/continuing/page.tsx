import { redirect } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Legacy URL from older auth flow — send straight to locale home. */
export default async function AuthContinuingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) redirect("/");
  redirect(`/${raw as Locale}`);
}
