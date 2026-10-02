import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

/** Opens the website product editor for an inventory product matched by slug. */
export default async function AdminProductBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) redirect("/admin/products");

  const product = await prisma.product.findFirst({
    where: { slug: { equals: slug, mode: "insensitive" } },
    select: { id: true },
  });

  if (!product) {
    redirect(`/admin/products?q=${encodeURIComponent(slug)}`);
  }

  redirect(`/admin/products/${product.id}/edit`);
}
