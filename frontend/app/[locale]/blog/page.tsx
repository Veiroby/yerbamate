import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { SiteHeader } from "@/app/components/site-header";
import { Footer } from "@/app/components/landing/Footer";
import { createT, getTranslations, isValidLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BlogListPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const [posts, user, translations] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleLv: true,
        excerptEn: true,
        excerptLv: true,
        coverImageUrl: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    getCurrentUser(),
    getTranslations(locale),
  ]);
  const t = createT(translations);
  const activeLocale = locale as Locale;
  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1a1a1a] lg:bg-white">
      <SiteHeader user={user ? { isAdmin: hasAdminAccess(user) } : null} locale={activeLocale} />
      <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-black">{t("blog.title")}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t("blog.subtitle")}</p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-zinc-600">{t("blog.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const title = activeLocale === "lv" ? post.titleLv : post.titleEn;
              const fallbackTitle = activeLocale === "lv" ? post.titleEn : post.titleLv;
              const excerpt = activeLocale === "lv" ? post.excerptLv : post.excerptEn;
              const fallbackExcerpt = activeLocale === "lv" ? post.excerptEn : post.excerptLv;
              const date = post.publishedAt ?? post.createdAt;
              return (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <Link href={`${prefix}/blog/${post.slug}`} className="block">
                    <div className="relative h-44 w-full bg-zinc-100">
                      {post.coverImageUrl ? (
                        <Image
                          src={post.coverImageUrl}
                          alt={title || fallbackTitle}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {new Date(date).toLocaleDateString()}
                      </p>
                      <h2 className="line-clamp-2 text-lg font-semibold text-zinc-900">
                        {title || fallbackTitle}
                      </h2>
                      <p className="line-clamp-3 text-sm text-zinc-600">
                        {excerpt || fallbackExcerpt || t("blog.defaultExcerpt")}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer locale={activeLocale} />
    </div>
  );
}
