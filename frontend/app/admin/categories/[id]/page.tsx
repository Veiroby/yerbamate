import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess, hasAdminWriteAccess } from "@/lib/admin-access";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCategoryEditPage({ params }: Props) {
  const admin = await getCurrentUser();
  if (!admin || !hasAdminAccess(admin)) notFound();

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/admin/categories" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Categories
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900">Edit category</h1>

      <form
        action={async (formData) => {
          "use server";
          const user = await requireAdminWrite();
          const name = formData.get("name")?.toString().trim();
          const slugRaw = formData.get("slug")?.toString().trim();
          if (!name) redirect(`/admin/categories/${id}?error=name`);
          const slug = slugRaw ? slugify(slugRaw) : slugify(name);
          if (!slug) redirect(`/admin/categories/${id}?error=slug`);
          const taken = await prisma.category.findFirst({
            where: { slug, id: { not: id } },
            select: { id: true },
          });
          if (taken) redirect(`/admin/categories/${id}?error=slug_taken`);
          await prisma.category.update({
            where: { id },
            data: { name, slug },
          });
          await writeAuditLog(user.id, "category.updated", "Category", id, { name, slug });
          revalidatePath("/admin/categories");
          revalidatePath("/admin/products");
          redirect("/admin/categories?saved=1");
        }}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <label className="block text-sm">
          <span className="text-zinc-600">Display name</span>
          <input
            name="name"
            required
            defaultValue={category.name}
            disabled={!hasAdminWriteAccess(admin)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Slug (handle)</span>
          <input
            name="slug"
            defaultValue={category.slug}
            disabled={!hasAdminWriteAccess(admin)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm disabled:bg-zinc-100"
          />
        </label>
        <p className="text-xs text-zinc-500">{category._count.products} products in this category.</p>
        {hasAdminWriteAccess(admin) ? (
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save changes
          </button>
        ) : (
          <p className="text-sm text-amber-800">Read-only (support role).</p>
        )}
      </form>
    </div>
  );
}
