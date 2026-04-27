"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BlogListRow = {
  id: string;
  slug: string;
  titleEn: string;
  titleLv: string;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export function BlogListClient() {
  const router = useRouter();
  const [rows, setRows] = useState<BlogListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [slug, setSlug] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleLv, setTitleLv] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/blog-posts");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error ?? "Failed to load blog posts");
        setRows([]);
      } else {
        setRows(data.posts ?? []);
        setStatus("");
      }
      setLoading(false);
    };
    void load();
  }, []);

  const createPost = async () => {
    if (!slug.trim() || !titleEn.trim() || !titleLv.trim()) {
      setStatus("Slug, English title, and Latvian title are required.");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/admin/blog-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug.trim(),
        titleEn: titleEn.trim(),
        titleLv: titleLv.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setStatus(data.error ?? "Failed to create post");
      return;
    }
    router.push(`/admin/blog/${data.post.id}`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Create blog post</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug (e.g. mate-brewing-guide)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Title (English)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={titleLv}
            onChange={(e) => setTitleLv(e.target.value)}
            placeholder="Title (Latvian)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={createPost}
            disabled={creating}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create post"}
          </button>
          {status ? <span className="text-xs text-zinc-500">{status}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Blog posts</h2>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading blog posts...</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No posts yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="px-2 py-2">Slug</th>
                  <th className="px-2 py-2">Title (EN / LV)</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Updated</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100">
                    <td className="px-2 py-3 font-mono text-xs text-zinc-700">{row.slug}</td>
                    <td className="px-2 py-3">
                      <p className="font-medium text-zinc-900">{row.titleEn}</p>
                      <p className="text-zinc-600">{row.titleLv}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-700">
                        {row.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-zinc-500">
                      {new Date(row.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/blog/${row.id}`}
                        className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
