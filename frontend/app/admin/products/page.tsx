import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { saveProductImage } from "@/lib/upload";
import { setProductQuantity, setProductQuantityWithLocation } from "./product-quantity";
import { DeleteProductButton } from "./delete-product-button";

function totalStock(
  variants: { inventoryItems: { quantity: number }[] }[],
): number {
  return variants.reduce(
    (sum, v) =>
      sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function deleteProductAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId")?.toString();
  if (!productId) return;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return;
  const variants = await prisma.variant.findMany({
    where: { productId },
    select: { id: true },
  });
  const variantIds = variants.map((v) => v.id);
  await prisma.inventoryItem.deleteMany({
    where: { variantId: { in: variantIds } },
  });
  await prisma.product.delete({
    where: { id: productId },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products?saved=1");
}

async function saveProductInline(formData: FormData) {
  "use server";

  const productId = formData.get("productId")?.toString();
  if (!productId) return;

  const quantityRaw = formData.get("quantity")?.toString();
  const stockLocationRaw = (formData.get("stockLocation")?.toString() || "instock") as "instock" | "warehouse";
  const categoryId = formData.get("categoryId")?.toString().trim() || null;
  const barcode = formData.get("barcode")?.toString().trim() || null;
  const weight = formData.get("weight")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString();
  const active = formData.get("active") === "on";

  const updates: Parameters<typeof prisma.product.update>[0]["data"] = {};

  if (categoryId !== null) {
    updates.categoryId = categoryId || undefined;
  }
  if (barcode !== null) {
    updates.barcode = barcode || undefined;
  }
  if (weight !== null) {
    updates.weight = weight || undefined;
  }
  if (priceRaw != null) {
    const price = Number.parseFloat(priceRaw);
    if (Number.isFinite(price) && price >= 0) {
      updates.price = price;
    }
  }
  updates.stockLocation = stockLocationRaw === "warehouse" ? "warehouse" : "instock";
  updates.active = active;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(updates).length > 0) {
      await tx.product.update({
        where: { id: productId },
        data: updates,
      });
    }

    if (quantityRaw != null && quantityRaw !== "") {
      const quantity = Math.max(0, Math.floor(Number(quantityRaw)));
      await setProductQuantityWithLocation(
        productId,
        Number.isFinite(quantity) ? quantity : 0,
        stockLocationRaw === "warehouse" ? "warehouse" : undefined,
      );
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products?saved=1");
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const categoryDelegate =
    "category" in prisma && typeof (prisma as { category?: { findMany: (args: unknown) => Promise<unknown[]> } }).category?.findMany === "function"
      ? (prisma as { category: { findMany: (args: unknown) => Promise<{ id: string; name: string; slug: string }[]> } }).category
      : null;

  const query = searchParams?.q?.toString().trim() || "";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { barcode: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
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
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
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
                const name = formData.get("name")?.toString().trim();
                if (!name) return;
                const slug = slugify(name) || "category";
                const existing = await prisma.category.findUnique({
                  where: { slug },
                });
                const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
                await prisma.category.create({
                  data: { name, slug: finalSlug },
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

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Add product
        </h2>
        <form
          action={async (formData) => {
            "use server";
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
              );
            }
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

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-zinc-900">
              Products
            </h2>
            <p className="text-xs text-zinc-500">
              Quickly edit stock, pricing, and meta data here. Use{" "}
              <span className="font-semibold">Edit details</span> to change full product information.
            </p>
          </div>
          <form className="flex gap-2" action="/admin/products" method="get">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, slug, or barcode"
              className="w-48 rounded-full border border-zinc-300 px-3 py-1.5 text-xs sm:w-64"
            />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Search
            </button>
          </form>
        </div>
        <div className="space-y-3 text-sm">
          {products.map((product) => (
            <form
              key={product.id}
              action={saveProductInline}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
            >
              <div className="flex items-start gap-3">
                {product.images[0] ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-zinc-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        /products/{product.slug}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-zinc-700">
                      {product.currency}{" "}
                      {(product.price as unknown as number).toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {product.weight && <>Weight: {product.weight} · </>}
                    {product.category && <>Category: {product.category.name} · </>}
                    Stock:{" "}
                    {product.stockLocation === "warehouse"
                      ? "Warehouse (5–7 days)"
                      : `${totalStock(product.variants)} in stock`}
                    {product.images.length > 0 && (
                      <> · {product.images.length} image(s)</>
                    )}
                  </p>
                </div>
              </div>

              <input type="hidden" name="productId" value={product.id} />

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Stock</p>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-zinc-500">Qty</label>
                      <input
                        type="number"
                        name="quantity"
                        min={0}
                        defaultValue={totalStock(product.variants)}
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Location</p>
                    <select
                      name="stockLocation"
                      defaultValue={product.stockLocation ?? "instock"}
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    >
                      <option value="instock">In stock</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
                  </div>
                </div>

                {categoryDelegate && (
                  <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-zinc-700">Category</p>
                      <select
                        name="categoryId"
                        defaultValue={product.categoryId ?? ""}
                        className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      >
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Barcode</p>
                    <input
                      type="text"
                      name="barcode"
                      defaultValue={product.barcode ?? ""}
                      placeholder="Barcode"
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Weight</p>
                    <input
                      type="text"
                      name="weight"
                      defaultValue={product.weight ?? ""}
                      placeholder="e.g. 500g"
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-xl bg-white px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-zinc-700">Price</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        {product.currency}
                      </span>
                      <input
                        type="number"
                        name="price"
                        step="0.01"
                        min={0}
                        defaultValue={Number(product.price)}
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={product.active}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    Active
                  </label>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                  >
                    Edit details
                  </Link>
                </div>
                <DeleteProductButton
                  productId={product.id}
                  productName={product.name}
                  deleteAction={deleteProductAction}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Save all changes
                </button>
              </div>
            </form>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-zinc-500">No products yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

