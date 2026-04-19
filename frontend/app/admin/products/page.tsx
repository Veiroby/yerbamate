import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { saveProductImage } from "@/lib/upload";
import { setProductQuantityWithLocation } from "./product-quantity";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";
import { AdminProductsEditor } from "./AdminProductsEditor";
import { slugify } from "@/lib/slugify";

async function deleteProductAction(formData: FormData) {
  // no-op: delete is handled by `app/admin/products/actions.ts`
  "use server";
  void formData;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const categoryDelegate =
    "category" in prisma && typeof (prisma as { category?: { findMany: (args: unknown) => Promise<unknown[]> } }).category?.findMany === "function"
      ? (prisma as { category: { findMany: (args: unknown) => Promise<{ id: string; name: string; slug: string }[]> } }).category
      : null;

  const sp = await searchParams;
  const query = sp?.q?.toString().trim() || "";
  const archivedView = sp?.view === "archived";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        archived: archivedView,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { barcode: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { include: { inventoryItems: true } },
        ...(categoryDelegate && { category: true }),
      },
    }),
    categoryDelegate
      ? categoryDelegate.findMany({ orderBy: { name: "asc" as const } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <section
        id="admin-product-categories"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Categories
        </h2>
        {!categoryDelegate ? (
          <p className="text-sm text-zinc-500">
            Restart the dev server (npm run dev) to enable categories.
          </p>
        ) : (
          <>
            <form
              action={async (formData) => {
                "use server";
                const user = await requireAdminWrite();
                const name = formData.get("name")?.toString().trim();
                if (!name) return;
                const slug = slugify(name) || "category";
                const existing = await prisma.category.findUnique({
                  where: { slug },
                });
                const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
                const cat = await prisma.category.create({
                  data: { name, slug: finalSlug },
                });
                await writeAuditLog(user.id, "category.created", "Category", cat.id, {
                  name,
                  slug: finalSlug,
                });
                revalidatePath("/admin/products");
                redirect("/admin/products?saved=1");
              }}
              className="mb-4 flex flex-wrap items-end gap-3"
            >
              <label className="flex flex-col gap-1 text-xs text-zinc-600">
                New category
                <input
                  name="name"
                  placeholder="e.g. Yerba Mate"
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Add category
              </button>
            </form>
            {categories.length > 0 ? (
              <ul className="flex flex-wrap gap-2 text-sm text-zinc-600">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full bg-zinc-100 px-3 py-1"
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No categories yet. Add one above.</p>
            )}
          </>
        )}
      </section>

      <section
        id="admin-product-add"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Add product
        </h2>
        <form
          action={async (formData) => {
            "use server";
            const user = await requireAdminWrite();
            const name = formData.get("name")?.toString().trim();
            const slug = formData.get("slug")?.toString().trim();
            const price = Number.parseFloat(
              formData.get("price")?.toString() ?? "0",
            );
            const description =
              formData.get("description")?.toString().trim() || null;
            const barcode =
              formData.get("barcode")?.toString().trim() || null;
            const weight =
              formData.get("weight")?.toString().trim() || null;
            const quantityRaw = formData.get("quantity")?.toString();
            const quantity = quantityRaw
              ? Math.max(0, Math.floor(Number(quantityRaw)))
              : null;

            if (!name || !slug || !Number.isFinite(price)) {
              return;
            }

            const categoryId = formData.get("categoryId")?.toString().trim() || null;
            const stockLocation = (formData.get("stockLocation")?.toString() || "instock") as "instock" | "warehouse";
            const product = await prisma.product.create({
              data: {
                name,
                slug,
                price,
                descriptionEn: description,
                // Keep legacy single-language column in sync (English).
                description,
                barcode: barcode || undefined,
                weight: weight || undefined,
                categoryId: categoryId || undefined,
                stockLocation: stockLocation === "warehouse" ? "warehouse" : "instock",
              },
            });

            for (let i = 0; i < 3; i++) {
              const file = formData.get(`image${i + 1}`) as File | null;
              if (file && file.size > 0) {
                try {
                  const url = await saveProductImage(product.id, i, file);
                  await prisma.productImage.create({
                    data: {
                      productId: product.id,
                      url,
                      position: i,
                      altText: `${name} image ${i + 1}`,
                    },
                  });
                } catch {
                  // skip invalid file
                }
              }
            }

            if (quantity !== null) {
              await setProductQuantityWithLocation(
                product.id,
                quantity,
                stockLocation === "warehouse" ? "warehouse" : undefined,
                { actorId: user.id, reason: "admin_product_create" },
              );
            }
            await writeAuditLog(user.id, "product.created", "Product", product.id, {
              name,
              slug,
            });
            revalidatePath("/admin/products");
            revalidatePath("/admin/inventory");
            redirect("/admin/products?saved=1");
          }}
          encType="multipart/form-data"
          className="grid gap-3 md:grid-cols-4"
        >
          <input
            name="name"
            placeholder="Name"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <input
            name="slug"
            placeholder="Slug (unique)"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <input
            name="price"
            placeholder="Price"
            type="number"
            step="0.01"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            required
          />
          <input
            name="description"
            placeholder="Short description"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="barcode"
            placeholder="Barcode (optional, for scanning)"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="weight"
            placeholder="Weight (e.g. 500g)"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Stock location
            <select
              name="stockLocation"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="instock">In stock (quantity)</option>
              <option value="warehouse">In warehouse (get in 5–7 days)</option>
            </select>
          </label>
          <input
            name="quantity"
            placeholder="Quantity (stock)"
            type="number"
            min={0}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          {categoryDelegate && (
            <label className="flex flex-col gap-1 text-xs text-zinc-600 md:col-span-2">
              Category
              <select
                name="categoryId"
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="md:col-span-4 space-y-2">
            <p className="text-xs font-medium text-zinc-600">
              Images (up to 3, optional)
            </p>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((n) => (
                <label
                  key={n}
                  className="flex flex-col gap-1 text-xs text-zinc-500"
                >
                  Image {n}
                  <input
                    name={`image${n}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="rounded-lg border border-zinc-300 text-zinc-700"
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save product
          </button>
        </form>
      </section>

      <section
        id="admin-product-list"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <AdminProductsEditor
          listView={archivedView ? "archived" : "active"}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            currency: p.currency,
            price: Number(p.price),
            weight: p.weight ?? null,
            shippingWeightKg:
              p.shippingWeightKg != null ? Number(p.shippingWeightKg) : null,
            barcode: p.barcode ?? null,
            active: p.active,
            archived: p.archived,
            createdAt: p.createdAt.toISOString(),
            categoryId: p.categoryId ?? null,
            category: (p as { category?: { name: string } | null }).category ?? null,
            stockLocation:
              p.stockLocation === "warehouse"
                ? "warehouse"
                : p.stockLocation === "instock"
                  ? "instock"
                  : null,
            images: p.images,
            variants: p.variants,
          }))}
          categories={categories}
        />
      </section>
    </div>
  );
}

