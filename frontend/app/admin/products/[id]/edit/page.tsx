import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess, hasAdminWriteAccess } from "@/lib/admin-access";
import { requireAdminWrite } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";
import { saveProductImage } from "@/lib/upload";
import { FocalPointPicker } from "../focal-point-picker";
import { setProductQuantityWithLocation } from "../../product-quantity";
import { ConfirmDeleteImageForm } from "@/app/admin/components/confirm-delete-image-form";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; updated?: string; error?: string }>;
};

function toOptionalString(value: FormDataEntryValue | null): string | null {
  const v = value?.toString().trim() ?? "";
  return v ? v : null;
}

async function deleteImageAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId")?.toString();
  const imageId = formData.get("imageId")?.toString();
  if (!productId || !imageId) return;

  const user = await getCurrentUser();
  if (!user || !hasAdminWriteAccess(user)) {
    notFound();
  }

  await prisma.productImage.delete({
    where: { id: imageId },
  });

  await writeAuditLog(user.id, "product.image_deleted", "Product", productId, { imageId });

  await revalidatePath(`/admin/products/${productId}/edit`);
  await revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

async function updateFocalPointAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId")?.toString();
  const imageId = formData.get("imageId")?.toString();
  const focalX = Number.parseFloat(formData.get("focalX")?.toString() ?? "");
  const focalY = Number.parseFloat(formData.get("focalY")?.toString() ?? "");
  const zoom = Number.parseFloat(formData.get("zoom")?.toString() ?? "");
  if (
    !productId ||
    !imageId ||
    Number.isNaN(focalX) ||
    Number.isNaN(focalY) ||
    Number.isNaN(zoom)
  ) {
    return;
  }

  const user = await getCurrentUser();
  if (!user || !hasAdminWriteAccess(user)) {
    notFound();
  }

  const clamp = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
  const clampZoom = (value: number) =>
    value < 1 ? 1 : value > 2 ? 2 : value;

  await prisma.productImage.update({
    where: { id: imageId },
    data: {
      focalX: clamp(focalX),
      focalY: clamp(focalY),
      zoom: clampZoom(zoom),
    },
  });

  await revalidatePath(`/admin/products/${productId}/edit`);
  await revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

function slugFromInput(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function updateProductNameAndSlugAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const slugRaw = formData.get("slug")?.toString().trim();
  if (!productId || !name) {
    redirect(`/admin/products/${productId}/edit?error=name_required`);
    return;
  }
  const slug = slugRaw ? slugFromInput(slugRaw) : slugFromInput(name);
  if (!slug) {
    redirect(`/admin/products/${productId}/edit?error=slug_invalid`);
    return;
  }

  const user = await getCurrentUser();
  if (!user || !hasAdminWriteAccess(user)) {
    notFound();
  }

  const existing = await prisma.product.findFirst({
    where: { slug, id: { not: productId } },
    select: { id: true },
  });
  if (existing) {
    redirect(`/admin/products/${productId}/edit?error=slug_taken`);
    return;
  }

  await prisma.product.update({
    where: { id: productId },
    data: { name, slug },
  });

  await writeAuditLog(user.id, "product.name_slug_updated", "Product", productId, { name, slug });

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?updated=name`);
}

async function updateProductDetailsAction(formData: FormData) {
  "use server";
  const productId = formData.get("productId")?.toString();
  if (!productId) redirect("/admin/products");

  const user = await getCurrentUser();
  if (!user || !hasAdminWriteAccess(user)) notFound();

  const descriptionEn = toOptionalString(formData.get("descriptionEn") ?? null);
  const descriptionLv = toOptionalString(formData.get("descriptionLv") ?? null);
  const weight = toOptionalString(formData.get("weight") ?? null);
  const shippingWeightKgRaw = formData.get("shippingWeightKg")?.toString().trim() ?? "";
  let shippingWeightKg: number | null = null;
  if (shippingWeightKgRaw !== "") {
    shippingWeightKg = Number.parseFloat(shippingWeightKgRaw);
  }
  const barcode = toOptionalString(formData.get("barcode") ?? null);

  const priceRaw = formData.get("price")?.toString() ?? "";
  const price = Number.parseFloat(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    redirect(`/admin/products/${productId}/edit?error=invalid_price`);
  }

  if (
    shippingWeightKgRaw !== "" &&
    (shippingWeightKg === null ||
      !Number.isFinite(shippingWeightKg) ||
      shippingWeightKg < 0)
  ) {
    redirect(`/admin/products/${productId}/edit?error=invalid_shipping_weight`);
  }

  const stockLocationRaw = formData.get("stockLocation")?.toString();
  const stockLocation =
    stockLocationRaw === "warehouse" ? ("warehouse" as const) : ("instock" as const);

  const quantityRaw = formData.get("quantity")?.toString() ?? "0";
  const quantity = Number.parseInt(quantityRaw, 10);
  const safeQty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;

  const active = formData.get("active") === "on";
  const isDraft = formData.get("isDraft") === "on";

  const compareAtRaw = formData.get("compareAtPrice")?.toString().trim() ?? "";
  let compareAtPrice: number | null = null;
  if (compareAtRaw !== "") {
    const cap = Number.parseFloat(compareAtRaw);
    if (!Number.isFinite(cap) || cap < 0) {
      redirect(`/admin/products/${productId}/edit?error=invalid_compare_at`);
    }
    compareAtPrice = cap;
  }

  const categoryIdRaw = formData.get("categoryId")?.toString() ?? "";
  const categoryId = categoryIdRaw ? categoryIdRaw : null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      // Keep `description` (legacy single-language) in sync with English.
      descriptionEn: descriptionEn ?? undefined,
      descriptionLv: descriptionLv ?? undefined,
      description: descriptionEn ?? undefined,
      weight: weight ?? undefined,
      shippingWeightKg: shippingWeightKgRaw === "" ? null : shippingWeightKg,
      barcode: barcode ?? undefined,
      price,
      compareAtPrice: compareAtRaw === "" ? null : compareAtPrice,
      stockLocation,
      active,
      isDraft,
      categoryId: categoryId ?? undefined,
    },
  });

  await setProductQuantityWithLocation(
    productId,
    safeQty,
    stockLocation === "warehouse" ? "warehouse" : undefined,
    { actorId: user.id, reason: "admin_product_edit_details" },
  );

  await writeAuditLog(user.id, "product.details_updated", "Product", productId, {
    price,
    active,
    isDraft,
    compareAtPrice: compareAtRaw === "" ? null : compareAtPrice,
    stockLocation,
  });

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?updated=details`);
}

export default async function AdminProductEditPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user)) notFound();

  const { id } = await params;
  const { saved, updated, error: errorParam } = await searchParams;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { include: { inventoryItems: true } },
    },
  });
  if (!product) notFound();

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const quantityLeft = product.variants.reduce(
    (sum, v) => sum + v.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  return (
    <div className="space-y-6">
      {saved === "1" && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Images saved successfully.
        </p>
      )}
      {updated === "name" && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Name and slug updated successfully.
        </p>
      )}
      {updated === "details" && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Product details updated successfully.
        </p>
      )}
      {errorParam === "slug_taken" && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          That slug is already in use. Choose another.
        </p>
      )}
      {errorParam === "slug_invalid" && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Slug must contain at least one letter or number.
        </p>
      )}
      {errorParam === "name_required" && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Name is required.
        </p>
      )}
      {errorParam === "invalid_price" && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Price must be a valid non-negative number.
        </p>
      )}
      {errorParam === "invalid_shipping_weight" && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Shipping weight must be empty or a valid non-negative number (kg).
        </p>
      )}
      {errorParam === "invalid_compare_at" && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Compare-at price must be empty or a valid non-negative number.
        </p>
      )}
      {errorParam &&
        ![
          "slug_taken",
          "slug_invalid",
          "name_required",
          "invalid_price",
          "invalid_shipping_weight",
          "invalid_compare_at",
        ].includes(errorParam) && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">
          Upload failed. Check file type (JPEG, PNG, WebP, GIF) and size (max 10MB). See terminal for details.
        </p>
      )}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Products
        </Link>
        <h2 className="text-lg font-semibold text-zinc-900">
          Edit product: {product.name}
        </h2>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Name &amp; slug
        </h3>
        <form action={updateProductNameAndSlugAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="productId" value={product.id} />
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Product name
            <input
              type="text"
              name="name"
              defaultValue={product.name}
              required
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="e.g. Yerba Mate 1kg"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Slug (URL path, unique)
            <input
              type="text"
              name="slug"
              defaultValue={product.slug}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-mono"
              placeholder="e.g. yerba-mate-1kg"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save name &amp; slug
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          Slug is used in the product URL (/products/[slug]). Leave empty to auto-generate from name.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Product details (description, price, stock)
        </h3>
        <form action={updateProductDetailsAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="productId" value={product.id} />

          <label className="flex flex-col gap-1 text-xs text-zinc-600 md:col-span-1">
            Description (EN)
            <textarea
              name="descriptionEn"
              defaultValue={product.descriptionEn ?? product.description ?? ""}
              className="min-h-28 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Full description (English)"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600 md:col-span-1">
            Description (LV)
            <textarea
              name="descriptionLv"
              defaultValue={product.descriptionLv ?? ""}
              className="min-h-28 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Full description (Latvian)"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Price
            <input
              type="number"
              name="price"
              step="0.01"
              min={0}
              defaultValue={Number(product.price).toString()}
              required
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Compare-at price (optional)
            <input
              type="number"
              name="compareAtPrice"
              step="0.01"
              min={0}
              defaultValue={
                product.compareAtPrice != null
                  ? Number(product.compareAtPrice).toString()
                  : ""
              }
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Strike-through / “was” price"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Weight
            <input
              type="text"
              name="weight"
              defaultValue={product.weight ?? ""}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="e.g. 500g"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Shipping weight (kg per unit)
            <input
              type="number"
              name="shippingWeightKg"
              step="0.001"
              min={0}
              defaultValue={
                product.shippingWeightKg != null
                  ? Number(product.shippingWeightKg).toString()
                  : ""
              }
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="for EU postal quotes"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Barcode
            <input
              type="text"
              name="barcode"
              defaultValue={product.barcode ?? ""}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="e.g. 1234567890123"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Stock location
            <select
              name="stockLocation"
              defaultValue={product.stockLocation ?? "instock"}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="instock">In stock (quantity)</option>
              <option value="warehouse">In warehouse (get in 5–7 days)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Quantity
            <input
              type="number"
              name="quantity"
              min={0}
              defaultValue={quantityLeft.toString()}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-600 md:col-span-1">
            Category
            <select
              name="categoryId"
              defaultValue={product.categoryId ?? ""}
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

          <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product.active}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Active
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
            <input
              type="checkbox"
              name="isDraft"
              defaultChecked={product.isDraft}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Draft (hidden from storefront)
          </label>

          <div className="flex items-center justify-start md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save product details
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Current images (up to 3)
        </h3>
        <div className="flex flex-wrap gap-4">
          {product.images.length === 0 ? (
            <p className="text-sm text-zinc-500">No images yet.</p>
          ) : (
            product.images.map((img) => (
              <div
                key={img.id}
                className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-3"
              >
                <FocalPointPicker
                  imageUrl={img.url}
                  alt={img.altText ?? product.name}
                  initialX={img.focalX}
                  initialY={img.focalY}
                  fieldNameX="focalX"
                  fieldNameY="focalY"
                  initialZoom={img.zoom ?? 1}
                  fieldNameZoom="zoom"
                />
                <form action={updateFocalPointAction} className="flex items-center gap-2 text-[11px]">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="imageId" value={img.id} />
                  {/* hidden focalX/focalY are controlled by FocalPointPicker */}
                  <button
                    type="submit"
                    className="rounded-full border border-emerald-200 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Save focal point
                  </button>
                </form>
                <ConfirmDeleteImageForm action={deleteImageAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="imageId" value={img.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </ConfirmDeleteImageForm>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Upload images (replaces existing, max 3)
        </h3>
        <form
          action={async (formData) => {
            "use server";
            const actor = await requireAdminWrite();
            const productId = formData.get("productId")?.toString();
            if (!productId) {
              redirect("/admin/products");
              return;
            }
            try {
              const product = await prisma.product.findUnique({
                where: { id: productId },
              });
              if (!product) {
                redirect(`/admin/products`);
                return;
              }

              // Collect files first so we can detect if any new images were selected
              const files: (File | null)[] = [];
              for (let i = 0; i < 3; i++) {
                const file = formData.get(`image${i + 1}`) as File | null;
                files.push(file && file.size > 0 ? file : null);
              }

              const hasNewImages = files.some((file) => file !== null);

              // If no new images were selected, keep existing ones and just return
              if (!hasNewImages) {
                redirect(`/admin/products/${productId}/edit`);
                return;
              }

              // Replace existing images only when at least one new image is provided
              await prisma.productImage.deleteMany({
                where: { productId },
              });

              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file) {
                  try {
                    const url = await saveProductImage(productId, i, file);
                    await prisma.productImage.create({
                      data: {
                        productId,
                        url,
                        position: i,
                        altText: `${product.name} image ${i + 1}`,
                      },
                    });
                  } catch (err) {
                    console.error(`Upload image ${i + 1} failed:`, err);
                    redirect(`/admin/products/${productId}/edit?error=upload`);
                    return;
                  }
                }
              }
              revalidatePath(`/admin/products/${productId}/edit`);
              revalidatePath("/admin/products");
              await writeAuditLog(actor.id, "product.images_replaced", "Product", productId, {});
              redirect(`/admin/products/${productId}/edit?saved=1`);
            } catch (err) {
              // Allow Next.js redirects (NEXT_REDIRECT) to bubble up without being treated as errors
              if (
                err &&
                typeof err === "object" &&
                "digest" in err &&
                typeof (err as { digest?: unknown }).digest === "string" &&
                (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
              ) {
                throw err;
              }
              console.error("Upload error:", err);
              redirect(`/admin/products/${productId}/edit?error=upload`);
            }
          }}
          encType="multipart/form-data"
          className="space-y-4"
        >
          <input type="hidden" name="productId" value={product.id} />
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3].map((n) => (
              <label
                key={n}
                className="flex flex-col gap-2 text-sm text-zinc-600"
              >
                Image {n}
                <input
                  name={`image${n}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-zinc-700"
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save images
          </button>
        </form>
      </section>
    </div>
  );
}
