"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

type EditorRefShape = {
  editor?: {
    loadDesign: (design: object) => void;
    exportHtml: (cb: (data: { html?: string; design?: object }) => void) => void;
  };
};

type BlogPost = {
  id: string;
  slug: string;
  titleEn: string;
  titleLv: string;
  excerptEn: string | null;
  excerptLv: string | null;
  htmlEn: string | null;
  htmlLv: string | null;
  designJsonEn: object | null;
  designJsonLv: object | null;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type Props = {
  postId: string;
};

type EditorLocale = "en" | "lv";

export function BlogPostEditor({ postId }: Props) {
  const editorRef = useRef<EditorRefShape | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editorLocale, setEditorLocale] = useState<EditorLocale>("en");
  const [previewHtml, setPreviewHtml] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [slug, setSlug] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleLv, setTitleLv] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [excerptLv, setExcerptLv] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [published, setPublished] = useState(false);

  const [htmlEn, setHtmlEn] = useState("");
  const [htmlLv, setHtmlLv] = useState("");
  const [designJsonEn, setDesignJsonEn] = useState<object | null>(null);
  const [designJsonLv, setDesignJsonLv] = useState<object | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/blog-posts/${postId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error ?? "Failed to load post");
        setLoading(false);
        return;
      }

      const p = data.post as BlogPost;
      setPost(p);
      setSlug(p.slug);
      setTitleEn(p.titleEn);
      setTitleLv(p.titleLv);
      setExcerptEn(p.excerptEn ?? "");
      setExcerptLv(p.excerptLv ?? "");
      setCoverImageUrl(p.coverImageUrl ?? "");
      setPublished(Boolean(p.published));
      setHtmlEn(p.htmlEn ?? "");
      setHtmlLv(p.htmlLv ?? "");
      setDesignJsonEn((p.designJsonEn as object | null) ?? null);
      setDesignJsonLv((p.designJsonLv as object | null) ?? null);
      setPreviewHtml(p.htmlEn ?? p.htmlLv ?? "");
      setStatus("");
      setLoading(false);
    };
    void load();
  }, [postId]);

  const currentDesign = useMemo(
    () => (editorLocale === "en" ? designJsonEn : designJsonLv),
    [editorLocale, designJsonEn, designJsonLv],
  );

  const currentHtml = useMemo(
    () => (editorLocale === "en" ? htmlEn : htmlLv),
    [editorLocale, htmlEn, htmlLv],
  );

  const handleEditorLoad = () => {
    if (currentDesign) {
      editorRef.current?.editor?.loadDesign(currentDesign);
      return;
    }
    editorRef.current?.editor?.loadDesign({
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text:
                        editorLocale === "en"
                          ? "<h1>Blog content (EN)</h1><p>Build this post using drag-and-drop blocks.</p>"
                          : "<h1>Blog content (LV)</h1><p>Veidojiet šo ierakstu ar velkamiem blokiem.</p>",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  };

  const exportEditor = (): Promise<{ html: string; design: object }> =>
    new Promise((resolve) => {
      editorRef.current?.editor?.exportHtml((data: { html?: string; design?: object }) => {
        resolve({ html: data?.html ?? "", design: data?.design ?? {} });
      });
    });

  const syncActiveLocaleFromEditor = async () => {
    const exported = await exportEditor();
    if (editorLocale === "en") {
      setHtmlEn(exported.html);
      setDesignJsonEn(exported.design);
    } else {
      setHtmlLv(exported.html);
      setDesignJsonLv(exported.design);
    }
    return exported;
  };

  const switchLocale = async (nextLocale: EditorLocale) => {
    if (nextLocale === editorLocale) return;
    await syncActiveLocaleFromEditor();
    setEditorLocale(nextLocale);
  };

  useEffect(() => {
    if (!loading) {
      const design = editorLocale === "en" ? designJsonEn : designJsonLv;
      if (design) {
        editorRef.current?.editor?.loadDesign(design);
      } else {
        handleEditorLoad();
      }
      setPreviewHtml(currentHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorLocale]);

  const refreshPreview = async () => {
    const exported = await syncActiveLocaleFromEditor();
    setPreviewHtml(exported.html);
    setStatus("Preview updated.");
  };

  const savePost = async () => {
    setSaving(true);
    await syncActiveLocaleFromEditor();
    const res = await fetch(`/api/admin/blog-posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        titleEn,
        titleLv,
        excerptEn,
        excerptLv,
        htmlEn,
        htmlLv,
        designJsonEn,
        designJsonLv,
        coverImageUrl,
        published,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setStatus(data.error ?? "Failed to save post");
      return;
    }
    setPost(data.post as BlogPost);
    setStatus("Post saved.");
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading post editor...</p>;
  if (!post) return <p className="text-sm text-red-600">Post not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Edit blog post</h1>
        <Link href="/admin/blog" className="text-sm text-zinc-600 hover:underline">
          Back to blog list
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Slug
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Cover image URL
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Title (EN)
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Title (LV)
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              value={titleLv}
              onChange={(e) => setTitleLv(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Excerpt (EN)
            <textarea
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              rows={3}
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Excerpt (LV)
            <textarea
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              rows={3}
              value={excerptLv}
              onChange={(e) => setExcerptLv(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void switchLocale("en")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${editorLocale === "en" ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"}`}
          >
            Editor EN
          </button>
          <button
            type="button"
            onClick={() => void switchLocale("lv")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${editorLocale === "lv" ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"}`}
          >
            Editor LV
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <EmailEditor ref={editorRef} onLoad={handleEditorLoad} minHeight={560} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshPreview}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={savePost}
            disabled={saving}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save post"}
          </button>
          {status ? <span className="text-xs text-zinc-500">{status}</span> : null}
        </div>
      </section>

      {previewHtml ? (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Live preview</p>
          <iframe
            title="blog-preview"
            className="h-[560px] w-full rounded-xl border border-zinc-200 bg-white"
            srcDoc={previewHtml}
          />
        </section>
      ) : null}
    </div>
  );
}
