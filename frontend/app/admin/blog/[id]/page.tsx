import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { BlogPostEditor } from "../blog-post-editor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogEditPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const exists = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) notFound();

  return <BlogPostEditor postId={id} />;
}
