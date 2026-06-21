import type { InstagramMediaItem } from "@/lib/instagram";

type Props = {
  media: InstagramMediaItem[];
  username: string;
};

function proxyInstagramImageUrl(src: string): string {
  return `/api/instagram/media-proxy?url=${encodeURIComponent(src)}`;
}

export function InstagramMediaGrid({ media, username }: Props) {
  return (
    <div className="grid grid-cols-3 gap-px bg-gray-200 sm:gap-0.5 sm:bg-gray-100">
      {media.slice(0, 9).map((m) => {
        const src =
          (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ??
          m.media_url ??
          m.thumbnail_url ??
          "";
        const href =
          m.permalink ??
          `https://www.instagram.com/${encodeURIComponent(username)}/`;
        return (
          <a
            key={m.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block w-full aspect-square overflow-hidden bg-gray-100"
            aria-label="Open Instagram post"
          >
            {src ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={proxyInstagramImageUrl(src)}
                alt={m.caption ? m.caption.slice(0, 120) : "Instagram post"}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-xs font-semibold text-white">
                IG
              </div>
            )}
          </a>
        );
      })}
    </div>
  );
}
