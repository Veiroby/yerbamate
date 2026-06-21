import { fetchInstagramMedia, getInstagramUsername } from "@/lib/instagram";
import { InstagramMediaGrid } from "./InstagramMediaGrid";

type Props = {
  username?: string;
  title?: string;
};

export async function InstagramGridSection({
  username: usernameProp,
  title = "Instagram",
}: Props) {
  const username = usernameProp || getInstagramUsername();
  const media = await fetchInstagramMedia(9, username);

  if (!media.length) return null;

  return (
    <section className="mx-auto w-full max-w-6xl py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-3 px-3 sm:px-0">
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

      <InstagramMediaGrid media={media} username={username} />
    </section>
  );
}
