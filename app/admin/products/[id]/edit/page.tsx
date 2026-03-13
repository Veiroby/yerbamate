import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveProductImage } from "@/lib/upload";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminProductEditPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();

  const { id } = await params;
  const { saved, error: errorParam } = await searchParams;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      {saved === "1" && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Images saved successfully.
        </p>
      )}
      {errorParam && (
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
          Images: {product.name}
        </h2>
      </div>

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
                className="relative aspect-square w-24 overflow-hidden rounded-xl bg-zinc-100"
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
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
