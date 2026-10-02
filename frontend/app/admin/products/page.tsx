import { prisma } from "@/lib/db";
import { AdminProductsEditor } from "./AdminProductsEditor";
import { ComputerImageFields } from "./computer-image-fields";
import { storefrontCategoryChoices } from "@/lib/store-categories";

async function deleteProductAction(formData: FormData) {
  // no-op: delete is handled by `app/admin/products/actions.ts`
  "use server";
  void formData;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    view?: string;
    error?: string;
    saved?: string;
    name?: string;
    price?: string;
    barcode?: string;
    quantity?: string;
  }>;
}) {
  const categoryDelegate =
    "category" in prisma && typeof (prisma as { category?: { findMany: (args: unknown) => Promise<unknown[]> } }).category?.findMany === "function"
      ? (prisma as { category: { findMany: (args: unknown) => Promise<{ id: string; name: string; slug: string }[]> } }).category
      : null;

  const sp = await searchParams;
  const query = sp?.q?.toString().trim() || "";
  const archivedView = sp?.view === "archived";
  const prefillName = sp?.name?.toString() ?? "";
  const prefillPrice = sp?.price?.toString() ?? "";
  const prefillBarcode = sp?.barcode?.toString() ?? "";
  const prefillQuantity = sp?.quantity?.toString() ?? "";

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

  const categoryChoices = storefrontCategoryChoices(categories);
  const defaultCategoryId =
    categoryChoices.find((category) => category.label === "Yerba Mate")?.id ??
    categoryChoices[0]?.id ??
    "";

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600">
        This is the catalog customers see on the website. Price, stock, photos, and active status update the shop as soon as you save.
      </p>

      <section
        id="admin-product-add"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Add product
        </h2>
        {sp?.error === "create" && (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
            Could not create that product. The slug may already be in use.
          </p>
        )}
        {sp?.error === "invalid" && (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
            Name, slug, and a valid price are required.
          </p>
        )}
        <form
          action="/api/admin/products"
          method="POST"
          encType="multipart/form-data"
          className="grid gap-3 md:grid-cols-4"
        >
          <input
            name="name"
            placeholder="Name"
            defaultValue={prefillName}
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
            defaultValue={prefillPrice}
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
            defaultValue={prefillBarcode}
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
            defaultValue={prefillQuantity}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          {categoryChoices.length > 0 && (
            <label className="flex flex-col gap-1 text-xs text-zinc-600 md:col-span-2">
              Category
              <select
                name="categoryId"
                defaultValue={defaultCategoryId}
                required
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              >
                {categoryChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="md:col-span-4">
            <ComputerImageFields />
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
          categories={categoryChoices}
        />
      </section>
    </div>
  );
}

