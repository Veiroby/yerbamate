import { fetchInstagramMedia, isInstagramConfigured } from "@/lib/instagram";

type Props = {
  username: string;
  title?: string;
};

export async function InstagramGridSection({ username, title = "Instagram" }: Props) {
  const media = await fetchInstagramMedia(9);
  const configured = isInstagramConfigured();
  if (!media.length && !configured) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-black sm:text-xl">{title}</h2>
        <a
          href={`https://www.instagram.com/${encodeURIComponent(username)}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[var(--mobile-cta)] hover:opacity-90"
        >
          @{username}
        </a>
      </div>

      {!media.length ? (
        <div className="rounded-3xl border border-black/5 bg-white p-5 text-sm text-gray-600 shadow-sm">
          Instagram feed is temporarily unavailable.
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {media.slice(0, 9).map((m) => {
          const src =
            (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? m.media_url ?? "";
          const href = m.permalink ?? `https://www.instagram.com/${encodeURIComponent(username)}/`;
          return (
            <a
              key={m.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5"
              aria-label="Open Instagram post"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={m.caption ? m.caption.slice(0, 120) : "Instagram media"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </a>
          );
        })}
      </div>
      )}
    </section>
  );
}

