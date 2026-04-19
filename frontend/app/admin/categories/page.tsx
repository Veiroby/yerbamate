import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Slug is the storefront handle (source of truth). Display name is editable independently.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Add category</h2>
        <form
          action={async (formData) => {
            "use server";
            const user = await requireAdminWrite();
            const name = formData.get("name")?.toString().trim();
            const slugInput = formData.get("slug")?.toString().trim();
            if (!name) redirect("/admin/categories?error=name");
            const slug = slugInput ? slugify(slugInput) || slugify(name) : slugify(name) || "category";
            const existing = await prisma.category.findUnique({ where: { slug } });
            const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
            const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
            const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
            const cat = await prisma.category.create({
              data: { name, slug: finalSlug, sortOrder },
            });
            await writeAuditLog(user.id, "category.created", "Category", cat.id, { name, slug: finalSlug });
            revalidatePath("/admin/categories");
            revalidatePath("/admin/products");
            redirect("/admin/categories?saved=1");
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Display name
            <input name="name" required className="rounded-xl border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Slug (optional)
            <input
              name="slug"
              placeholder="auto from name"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
          All categories
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Order</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Slug</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Products</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/50">
                  <td className="px-3 py-2">
                    <form
                      action={async (fd) => {
                        "use server";
                        const user = await requireAdminWrite();
                        const id = fd.get("id")?.toString();
                        const sortOrder = Math.floor(Number(fd.get("sortOrder")));
                        if (!id || !Number.isFinite(sortOrder)) return;
                        await prisma.category.update({
                          where: { id },
                          data: { sortOrder },
                        });
                        await writeAuditLog(user.id, "category.sort_updated", "Category", id, { sortOrder });
                        revalidatePath("/admin/categories");
                        revalidatePath("/admin/products");
                      }}
                      className="flex items-center gap-1"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="sortOrder"
                        type="number"
                        defaultValue={c.sortOrder}
                        className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <button type="submit" className="text-xs text-emerald-600 hover:underline">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 font-medium text-zinc-900">{c.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600">{c.slug}</td>
                  <td className="px-3 py-2 text-zinc-600">{c._count.products}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/categories/${c.id}`} className="text-emerald-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
