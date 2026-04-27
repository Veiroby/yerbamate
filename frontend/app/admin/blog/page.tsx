import { requireAdmin } from "@/lib/admin-auth";
import { BlogListClient } from "./blog-list-client";

export default async function AdminBlogPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Blog</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage localized blog posts and open each post to edit drag-and-drop content blocks.
        </p>
      </div>
      <BlogListClient />
    </div>
  );
}
