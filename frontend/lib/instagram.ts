import { createHmac } from "node:crypto";

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

/** Instagram web app id (public, used by instagram.com). */
const IG_WEB_APP_ID = "936619743392459";

/** Last-resort post shortcodes when live API is rate-limited (@yerbatealatvia). */
const STATIC_FALLBACK_SHORTCODES: {
  id: string;
  media_type: InstagramMediaItem["media_type"];
}[] = [
  { id: "DXgbM7NjcMi", media_type: "VIDEO" },
  { id: "DWRL9q7DQ4P", media_type: "IMAGE" },
  { id: "DLUVfqUC7nE", media_type: "IMAGE" },
  { id: "DKucc8gCHMF", media_type: "IMAGE" },
  { id: "DKo50z1i087", media_type: "IMAGE" },
  { id: "DKKhHi9CqkF", media_type: "IMAGE" },
  { id: "DKKbQP2i0Rw", media_type: "IMAGE" },
  { id: "DJt78IOiEoV", media_type: "IMAGE" },
  { id: "DJj114piguX", media_type: "IMAGE" },
];

const IG_BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

const IG_HTML_HEADERS = {
  ...IG_BROWSER_HEADERS,
  Accept: "text/html,application/xhtml+xml",
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

export function getInstagramUsername(): string {
  return sanitizeEnvValue(process.env.INSTAGRAM_USERNAME) || "yerbatealatvia";
}

export function getInstagramFallbackPostUrls(): string[] {
  const raw = sanitizeEnvValue(process.env.INSTAGRAM_FALLBACK_POST_URLS);
  const fromEnv = raw
    ? raw.split(/[\s,]+/).map((u) => u.trim()).filter((u) => u.startsWith("http"))
    : [];
  if (fromEnv.length) return fromEnv;
  return STATIC_FALLBACK_SHORTCODES.map(
    (m) => `https://www.instagram.com/p/${m.id}/`,
  );
}

export function isInstagramConfigured(): boolean {
  return (
    Boolean(getGraphApiToken() && getGraphApiIgUserId()) ||
    Boolean(getBasicDisplayToken()) ||
    Boolean(getInstagramUsername())
  );
}

function appSecretProof(accessToken: string): string | null {
  const secret = sanitizeEnvValue(
    process.env.META_APP_SECRET ?? process.env.FACEBOOK_APP_SECRET,
  );
  if (!secret) return null;
  return createHmac("sha256", secret).update(accessToken).digest("hex");
}

type FetchMeta = {
  phase: string;
  tokenLength?: number;
  igUserId?: string | null;
};

async function fetchJsonOrLog(
  url: string,
  meta: FetchMeta,
  revalidate = 300,
): Promise<{ ok: true; data: InstagramMediaResponse } | { ok: false }> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[instagram] fetch failed",
      JSON.stringify({
        phase: meta.phase,
        tokenLength: meta.tokenLength ?? null,
        igUserId: meta.igUserId ?? null,
        status: res.status,
        statusText: res.statusText,
        body: body.slice(0, 300),
      }),
    );
    return { ok: false };
  }
  const json = (await res.json().catch(() => null)) as InstagramMediaResponse | null;
  if (!json || !Array.isArray((json as { data?: unknown }).data)) return { ok: false };
  return { ok: true, data: json };
}

function filterRenderable(items: InstagramMediaItem[]): InstagramMediaItem[] {
  return items.filter((m) => {
    if (!m?.id) return false;
    const mediaUrl = typeof m.media_url === "string" ? m.media_url : "";
    const thumbUrl = typeof m.thumbnail_url === "string" ? m.thumbnail_url : "";
    return Boolean(mediaUrl || thumbUrl);
  });
}

async function fetchGraphMedia(
  graphToken: string,
  igUserId: string,
  limit: number,
): Promise<InstagramMediaItem[]> {
  const url = new URL(`https://graph.facebook.com/v20.0/${encodeURIComponent(igUserId)}/media`);
  url.searchParams.set(
    "fields",
    "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp",
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", graphToken);
  const proof = appSecretProof(graphToken);
  if (proof) url.searchParams.set("appsecret_proof", proof);
  const result = await fetchJsonOrLog(url.toString(), {
    phase: "instagram_graph",
    tokenLength: graphToken.length,
    igUserId,
  });
  if (!result.ok) return [];
  return filterRenderable(result.data.data);
}

async function fetchBasicDisplayMedia(
  basicToken: string,
  limit: number,
): Promise<InstagramMediaItem[]> {
  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set(
    "fields",
    "id,media_type,media_url,permalink,thumbnail_url,caption,timestamp",
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", basicToken);
  const result = await fetchJsonOrLog(url.toString(), {
    phase: "instagram_basic",
    tokenLength: basicToken.length,
  });
  if (!result.ok) return [];
  return filterRenderable(result.data.data);
}

type PublicProfileNode = {
  id?: string;
  shortcode?: string;
  display_url?: string;
  thumbnail_src?: string;
  is_video?: boolean;
  edge_media_to_caption?: { edges?: { node?: { text?: string } }[] };
  taken_at_timestamp?: number;
};

async function fetchPostOgImage(shortcode: string): Promise<string | null> {
  const pageUrl = `https://www.instagram.com/p/${shortcode}/`;
  try {
    const res = await fetch(pageUrl, {
      headers: IG_HTML_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/property="og:image" content="([^"]+)"/) ??
      html.match(/property='og:image' content='([^']+)'/);
    const raw = match?.[1];
    return raw ? raw.replace(/&amp;/g, "&") : null;
  } catch {
    return null;
  }
}

async function resolveStaticFallbackMedia(limit: number): Promise<InstagramMediaItem[]> {
  const items = STATIC_FALLBACK_SHORTCODES.slice(0, limit);
  const resolved = await Promise.all(
    items.map(async (item) => {
      const imageUrl = await fetchPostOgImage(item.id);
      const permalink = `https://www.instagram.com/p/${item.id}/`;
      return {
        id: item.id,
        media_type: item.media_type,
        media_url: item.media_type === "IMAGE" ? imageUrl ?? undefined : undefined,
        thumbnail_url: imageUrl ?? undefined,
        permalink,
      } satisfies InstagramMediaItem;
    }),
  );
  return filterRenderable(resolved);
}

async function fetchProfileHtmlMedia(
  username: string,
  limit: number,
): Promise<InstagramMediaItem[]> {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: IG_HTML_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const shortcodes = [...html.matchAll(/"shortcode":"([A-Za-z0-9_-]+)"/g)]
      .map((m) => m[1])
      .filter((code, index, all) => all.indexOf(code) === index)
      .slice(0, limit);
    if (!shortcodes.length) return [];

    const resolved = await Promise.all(
      shortcodes.map(async (shortcode) => {
        const imageUrl = await fetchPostOgImage(shortcode);
        return {
          id: shortcode,
          media_type: "IMAGE" as const,
          media_url: imageUrl ?? undefined,
          thumbnail_url: imageUrl ?? undefined,
          permalink: `https://www.instagram.com/p/${shortcode}/`,
        } satisfies InstagramMediaItem;
      }),
    );
    return filterRenderable(resolved);
  } catch (err) {
    console.warn("[instagram] profile html error", err);
    return [];
  }
}

async function fetchPublicProfileMedia(
  username: string,
  limit: number,
): Promise<InstagramMediaItem[]> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  try {
    const res = await fetch(url, {
      headers: {
        ...IG_BROWSER_HEADERS,
        "x-ig-app-id": IG_WEB_APP_ID,
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn("[instagram] public profile fetch", res.status, username);
      return [];
    }
    const json = (await res.json()) as {
      data?: {
        user?: {
          edge_owner_to_timeline_media?: { edges?: { node?: PublicProfileNode }[] };
        };
      };
    };
    const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
    return edges
      .map(({ node }) => node)
      .filter((node): node is PublicProfileNode => Boolean(node?.shortcode))
      .slice(0, limit)
      .map((node) => {
        const isVideo = Boolean(node.is_video);
        const displayUrl = node.display_url || node.thumbnail_src || "";
        const caption =
          node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 200) ?? "";
        return {
          id: node.id || node.shortcode!,
          media_type: isVideo ? "VIDEO" : "IMAGE",
          media_url: isVideo ? undefined : displayUrl,
          thumbnail_url: isVideo ? node.thumbnail_src || displayUrl : undefined,
          permalink: `https://www.instagram.com/p/${node.shortcode}/`,
          caption,
          timestamp: node.taken_at_timestamp
            ? new Date(node.taken_at_timestamp * 1000).toISOString()
            : undefined,
        } satisfies InstagramMediaItem;
      })
      .filter((m) => Boolean(m.media_url || m.thumbnail_url));
  } catch (err) {
    console.warn("[instagram] public profile error", err);
    return [];
  }
}

export async function fetchInstagramMedia(
  limit = 9,
  username = getInstagramUsername(),
): Promise<InstagramMediaItem[]> {
  const graphToken = getGraphApiToken();
  const igUserId = getGraphApiIgUserId();
  const basicToken = getBasicDisplayToken();

  if (graphToken && igUserId) {
    const graph = await fetchGraphMedia(graphToken, igUserId, limit);
    if (graph.length) return graph;
    console.warn(
      "[instagram] Graph API returned no media (token may be expired — regenerate in Meta developer console).",
    );
  }

  if (basicToken) {
    const basic = await fetchBasicDisplayMedia(basicToken, limit);
    if (basic.length) return basic;
  }

  const publicMedia = await fetchPublicProfileMedia(username, limit);
  if (publicMedia.length) return publicMedia;

  const profileHtmlMedia = await fetchProfileHtmlMedia(username, limit);
  if (profileHtmlMedia.length) return profileHtmlMedia;

  return resolveStaticFallbackMedia(limit);
}
