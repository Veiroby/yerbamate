export type InstagramMediaItem = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
};

export type InstagramMediaResponse = {
  data: InstagramMediaItem[];
};

function getAccessToken(): string | null {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  return token ? token : null;
}

export function isInstagramConfigured(): boolean {
  return Boolean(getAccessToken());
}

export async function fetchInstagramMedia(limit = 9): Promise<InstagramMediaItem[]> {
  const token = getAccessToken();
  if (!token) return [];

  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set(
    "fields",
    "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp",
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), {
    // "Real time" enough without hammering IG API.
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[instagram] fetch failed",
      JSON.stringify({
        status: res.status,
        statusText: res.statusText,
        body: body.slice(0, 300),
      }),
    );
    return [];
  }

  const json = (await res.json().catch(() => null)) as InstagramMediaResponse | null;
  const items = Array.isArray(json?.data) ? json!.data : [];

  // Keep only displayable items.
  return items.filter((m) => {
    if (!m?.id) return false;
    const mediaUrl = typeof m.media_url === "string" ? m.media_url : "";
    const thumbUrl = typeof m.thumbnail_url === "string" ? m.thumbnail_url : "";
    return Boolean(mediaUrl || thumbUrl);
  });
}

