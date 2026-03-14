import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export default async function AdminMainPageEditor() {
  const [settings, collections, products] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        homePromoProductIds: [],
      },
      update: {},
    }),
    prisma.collection.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const promoIds = settings.homePromoProductIds ?? [];
  const promoProducts = promoIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as { id: string; name: string; slug: string }[];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Main page</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Choose which collections and products appear on the homepage. Create collections under{" "}
          <Link href="/admin/collections" className="text-emerald-600 hover:underline">
            Collections
          </Link>{" "}
          and add products to them, then select them here.
        </p>
      </div>

      {/* New arrivals carousel */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          New arrivals carousel
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          Products from the selected collection are shown in the &quot;New arrivals&quot; carousel. If none is selected, the latest products are used.
        </p>
        <form
          action={async (formData) => {
            "use server";
            const id = formData.get("homeNewArrivalsCollectionId")?.toString() || null;
            await prisma.siteSettings.upsert({
              where: { id: "default" },
              create: { id: "default", homeNewArrivalsCollectionId: id },
              update: { homeNewArrivalsCollectionId: id },
            });
            revalidatePath("/admin/main-page");
            revalidatePath("/");
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Collection
            <select
              name="homeNewArrivalsCollectionId"
              defaultValue={settings.homeNewArrivalsCollectionId ?? ""}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm min-w-[200px]"
            >
              <option value="">— Latest products (default) —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save
          </button>
        </form>
      </section>

      {/* Top selling carousel */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Top selling carousel
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          Products from the selected collection are shown in the &quot;Top selling&quot; carousel. If none is selected, the latest products are used.
        </p>
        <form
          action={async (formData) => {
            "use server";
            const id = formData.get("homeTopSellingCollectionId")?.toString() || null;
            await prisma.siteSettings.upsert({
              where: { id: "default" },
              create: { id: "default", homeTopSellingCollectionId: id },
              update: { homeTopSellingCollectionId: id },
            });
            revalidatePath("/admin/main-page");
            revalidatePath("/");
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Collection
            <select
              name="homeTopSellingCollectionId"
              defaultValue={settings.homeTopSellingCollectionId ?? ""}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm min-w-[200px]"
            >
              <option value="">— Latest products (default) —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save
          </button>
        </form>
      </section>

      {/* Featured promo blocks (4 products) */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Featured promo blocks
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          The main page shows 4 featured product blocks (two rows of two). Choose up to 4 products in order. Positions 1–2 are the first row, 3–4 the second. Leave empty to use latest products.
        </p>
        <form
          action={async (formData) => {
            "use server";
            const ids = [1, 2, 3, 4]
              .map((i) => formData.get(`promoId${i}`)?.toString())
              .filter((id): id is string => !!id);
            await prisma.siteSettings.upsert({
              where: { id: "default" },
              create: { id: "default", homePromoProductIds: ids },
              update: { homePromoProductIds: ids },
            });
            revalidatePath("/admin/main-page");
            revalidatePath("/");
          }}
          className="space-y-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <label key={i} className="flex flex-col gap-1 text-xs text-zinc-600">
              Promo block {i} (row {i <= 2 ? 1 : 2})
              <select
                name={`promoId${i}`}
                defaultValue={promoIds[i - 1] ?? ""}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm max-w-md"
              >
                <option value="">— None (use default) —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save promo blocks
          </button>
        </form>
      </section>

      <p className="text-sm text-zinc-500">
        <Link href="/" className="text-emerald-600 hover:underline">
          View main page →
        </Link>
      </p>
    </div>
  );
}
