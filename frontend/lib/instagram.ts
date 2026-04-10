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

/** Meta rejects tokens with stray quotes, newlines, or BOM from .env / PM2 copies. */
function sanitizeEnvValue(raw: string | undefined): string | null {
  if (raw == null) return null;
  let s = raw.replace(/\uFEFF/g, "").replace(/\r/g, "").replace(/\n/g, "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s ? s : null;
}

function getBasicDisplayToken(): string | null {
  return sanitizeEnvValue(process.env.INSTAGRAM_ACCESS_TOKEN);
}

function getGraphApiToken(): string | null {
  return sanitizeEnvValue(process.env.INSTAGRAM_GRAPH_API_ACCESS_TOKEN);
}

function getGraphApiIgUserId(): string | null {
  return sanitizeEnvValue(process.env.INSTAGRAM_IG_USER_ID);
}

export function isInstagramConfigured(): boolean {
  return Boolean(getGraphApiToken() && getGraphApiIgUserId()) || Boolean(getBasicDisplayToken());
}

async function fetchJsonOrLog(url: string): Promise<{ ok: true; data: InstagramMediaResponse } | { ok: false }> {
  const res = await fetch(url, { next: { revalidate: 300 } });
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
    return { ok: false };
  }
  const json = (await res.json().catch(() => null)) as InstagramMediaResponse | null;
  if (!json || !Array.isArray((json as any).data)) return { ok: false };
  return { ok: true, data: json };
}

export async function fetchInstagramMedia(limit = 9): Promise<InstagramMediaItem[]> {
  const graphToken = getGraphApiToken();
  const igUserId = getGraphApiIgUserId();
  const basicToken = getBasicDisplayToken();
  if (!graphToken && !basicToken) return [];

  // Prefer Instagram Graph API (Business/Creator) if configured.
  if (graphToken && igUserId) {
    const url = new URL(`https://graph.facebook.com/v20.0/${encodeURIComponent(igUserId)}/media`);
    url.searchParams.set(
      "fields",
      "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp",
    );
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", graphToken);
    const result = await fetchJsonOrLog(url.toString());
    if (result.ok) {
      return result.data.data.filter((m) => {
        if (!m?.id) return false;
        const mediaUrl = typeof m.media_url === "string" ? m.media_url : "";
        const thumbUrl = typeof m.thumbnail_url === "string" ? m.thumbnail_url : "";
        return Boolean(mediaUrl || thumbUrl);
      });
    }
  }

  // Fallback: Instagram Basic Display (Personal/Creator with Basic Display token)
  if (!basicToken) return [];
  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set(
    "fields",
    "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp",
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", basicToken);

  const result = await fetchJsonOrLog(url.toString());
  if (!result.ok) return [];

  return result.data.data.filter((m) => {
    if (!m?.id) return false;
    const mediaUrl = typeof m.media_url === "string" ? m.media_url : "";
    const thumbUrl = typeof m.thumbnail_url === "string" ? m.thumbnail_url : "";
    return Boolean(mediaUrl || thumbUrl);
  });
}

