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

export default async function AdminProductsPage() {
  const categoryDelegate =
    "category" in prisma && typeof (prisma as { category?: { findMany: (args: unknown) => Promise<unknown[]> } }).category?.findMany === "function"
      ? (prisma as { category: { findMany: (args: unknown) => Promise<{ id: string; name: string; slug: string }[]> } }).category
      : null;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
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
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Products
        </h2>
        <div className="space-y-2 text-sm">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                {product.images[0] ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{product.name}</p>
                  <p className="text-xs text-zinc-500">
                    /products/{product.slug} – {product.currency}{" "}
                    {(product.price as unknown as number).toFixed(2)}
                    {product.weight && (
                      <> · {product.weight}</>
                    )}
                    {product.category && (
                      <> · {product.category.name}</>
                    )}
                    {product.images.length > 0 && (
                      <> · {product.images.length} image(s)</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <form
                  action={async (formData) => {
                    "use server";
                    const quantity = Math.max(
                      0,
                      Math.floor(
                        Number(formData.get("quantity")?.toString() ?? "0"),
                      ),
                    );
                    const loc = formData.get("stockLocation")?.toString() || "instock";
                    await setProductQuantityWithLocation(
                      product.id,
                      quantity,
                      loc === "warehouse" ? "warehouse" : undefined,
                    );
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                  className="flex items-center gap-1"
                >
                  <label className="text-xs text-zinc-500">Qty</label>
                  <input
                    type="hidden"
                    name="stockLocation"
                    value={product.stockLocation ?? "instock"}
                  />
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    defaultValue={totalStock(product.variants)}
                    className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Save
                  </button>
                </form>
                <form
                  action={async (formData) => {
                    "use server";
                    const stockLocation = (formData.get("stockLocation")?.toString() || "instock") as "instock" | "warehouse";
                    await prisma.product.update({
                      where: { id: product.id },
                      data: { stockLocation: stockLocation === "warehouse" ? "warehouse" : "instock" },
                    });
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                  className="flex items-center gap-1"
                >
                  <label className="text-xs text-zinc-500">Location</label>
                  <select
                    name="stockLocation"
                    defaultValue={product.stockLocation ?? "instock"}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                  >
                    <option value="instock">In stock</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Save
                  </button>
                </form>
                {categoryDelegate && (
                  <form
                    action={async (formData) => {
                      "use server";
                      const categoryId =
                        formData.get("categoryId")?.toString().trim() || null;
                    await prisma.product.update({
                      where: { id: product.id },
                      data: {
                        categoryId: categoryId || undefined,
                      },
                    });
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                    className="flex items-center gap-1"
                  >
                    <select
                      name="categoryId"
                      defaultValue={product.categoryId ?? ""}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      Save
                    </button>
                  </form>
                )}
                <form
                  action={async (formData) => {
                    "use server";
                    const barcode =
                      formData.get("barcode")?.toString().trim() || null;
                    await prisma.product.update({
                      where: { id: product.id },
                      data: { barcode: barcode || undefined },
                    });
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    name="barcode"
                    defaultValue={product.barcode ?? ""}
                    placeholder="Barcode"
                    className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Save
                  </button>
                </form>
                <form
                  action={async (formData) => {
                    "use server";
                    const weight =
                      formData.get("weight")?.toString().trim() || null;
                    await prisma.product.update({
                      where: { id: product.id },
                      data: { weight: weight || undefined },
                    });
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    name="weight"
                    defaultValue={product.weight ?? ""}
                    placeholder="Weight"
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Save
                  </button>
                </form>
                <form
                  action={async (formData) => {
                    "use server";
                    const price = Number.parseFloat(
                      formData.get("price")?.toString() ?? "0",
                    );
                    if (!Number.isFinite(price) || price < 0) return;
                    await prisma.product.update({
                      where: { id: product.id },
                      data: { price },
                    });
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                  className="flex items-center gap-1"
                >
                  <label className="text-xs text-zinc-500">Price</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min={0}
                    defaultValue={Number(product.price)}
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Save
                  </button>
                </form>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-xs font-medium text-zinc-600 hover:text-emerald-700"
                >
                  Edit images
                </Link>
                <form
                  action={async (formData) => {
                    "use server";
                    const active =
                      formData.get("active")?.toString() === "on";
                    await prisma.product.update({
                      where: { id: product.id },
                      data: { active },
                    });
                    revalidatePath("/admin/products");
                    revalidatePath("/admin/inventory");
                    redirect("/admin/products?saved=1");
                  }}
                  className="flex items-center gap-2"
                >
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={product.active}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    Active
                  </label>
                  <button
                    type="submit"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Update
                  </button>
                </form>
                <DeleteProductButton
                  productId={product.id}
                  productName={product.name}
                  deleteAction={deleteProductAction}
                />
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-zinc-500">No products yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

