import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          New collection
        </h2>
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name")?.toString().trim();
            if (!name) return;
            const slug = slugify(name) || "collection";
            const existing = await prisma.collection.findUnique({
              where: { slug },
            });
            const finalSlug = existing
              ? `${slug}-${Date.now().toString(36)}`
              : slug;
            await prisma.collection.create({
              data: { name, slug: finalSlug },
            });
            revalidatePath("/admin/collections");
            revalidatePath("/");
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Name
            <input
              name="name"
              placeholder="e.g. New arrivals"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create collection
          </button>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Collections
        </h2>
        <div className="space-y-2 text-sm">
          {collections.length === 0 ? (
            <p className="text-zinc-500">No collections yet. Create one above.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {collections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{c.name}</p>
                    <p className="text-xs text-zinc-500">
                      /{c.slug} · {c._count.products} product{c._count.products === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/collections/${c.id}`}
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit products
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
