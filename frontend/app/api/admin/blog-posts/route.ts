import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  titleEn: z.string().trim().min(2).max(200),
  titleLv: z.string().trim().min(2).max(200),
});

export async function GET() {
  const g = await adminApiGuard(false);
  if (!g.ok) return g.response;

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleLv: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid blog post data" }, { status: 400 });
  }

  try {
    const created = await prisma.blogPost.create({
      data: {
        slug: parsed.data.slug,
        titleEn: parsed.data.titleEn,
        titleLv: parsed.data.titleLv,
        excerptEn: "",
        excerptLv: "",
        htmlEn: "",
        htmlLv: "",
      },
    });

    await writeAuditLog(g.user.id, "blog_post.created", "BlogPost", created.id, {
      slug: created.slug,
    });

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
