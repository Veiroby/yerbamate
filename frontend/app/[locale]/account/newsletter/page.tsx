import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { isValidLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewsletterPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/account/profile`);

  const subscribed = await prisma.newsletterSubscriber.findUnique({
    where: { email: user.email },
  });

  const prefix = `/${locale}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          Newsletter Subscriptions
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your email preferences.
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-black">Newsletter</h2>
        <p className="mt-2 text-sm text-gray-600">
          {subscribed
            ? `You are subscribed with ${user.email}. You can unsubscribe from the link in any newsletter email.`
            : "You are not currently subscribed to our newsletter."}
        </p>
        <Link
          href={prefix}
          className="mt-4 inline-block text-sm font-medium text-black underline hover:no-underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
