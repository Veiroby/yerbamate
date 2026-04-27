import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { createT, getTranslations, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return null;
  const activeLocale = locale as Locale;

  const [post, user, translations] = await Promise.all([
    prisma.blogPost.findFirst({
      where: { slug, published: true },
      select: {
        slug: true,
        titleEn: true,
        titleLv: true,
        excerptEn: true,
        excerptLv: true,
        htmlEn: true,
        htmlLv: true,
        coverImageUrl: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    getCurrentUser(),
    getTranslations(locale),
  ]);
  if (!post) notFound();

  const t = createT(translations);
  const title = activeLocale === "lv" ? post.titleLv || post.titleEn : post.titleEn || post.titleLv;
  const excerpt =
    activeLocale === "lv" ? post.excerptLv || post.excerptEn : post.excerptEn || post.excerptLv;
  const html = activeLocale === "lv" ? post.htmlLv || post.htmlEn : post.htmlEn || post.htmlLv;
  const publishedDate = post.publishedAt ?? post.createdAt;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1a1a1a] lg:bg-white">
      <SiteHeader user={user ? { isAdmin: hasAdminAccess(user) } : null} locale={activeLocale} />
      <main className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
        <Link href={`/${locale}/blog`} className="text-sm text-zinc-600 hover:underline">
          {t("blog.backToList")}
        </Link>
        <article className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {post.coverImageUrl ? (
            <div className="relative h-56 w-full bg-zinc-100 sm:h-72">
              <Image
                src={post.coverImageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}
          <div className="p-5 sm:p-7">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {new Date(publishedDate).toLocaleDateString()}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
            {excerpt ? <p className="mt-3 text-sm text-zinc-600">{excerpt}</p> : null}
            <div
              className="prose prose-zinc mt-6 max-w-none"
              dangerouslySetInnerHTML={{ __html: html || `<p>${t("blog.emptyPost")}</p>` }}
            />
          </div>
        </article>
      </main>
      <Footer locale={activeLocale} />
    </div>
  );
}
