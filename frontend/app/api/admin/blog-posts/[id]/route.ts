import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { adminApiGuard } from "@/lib/admin-api-guard";
import { writeAuditLog } from "@/lib/admin-audit";

const updateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  titleEn: z.string().trim().min(2).max(200),
  titleLv: z.string().trim().min(2).max(200),
  excerptEn: z.string().max(500).optional().nullable(),
  excerptLv: z.string().max(500).optional().nullable(),
  htmlEn: z.string().optional().nullable(),
  htmlLv: z.string().optional().nullable(),
  designJsonEn: z.unknown().optional().nullable(),
  designJsonLv: z.unknown().optional().nullable(),
  coverImageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  published: z.boolean(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const g = await adminApiGuard(false);
  if (!g.ok) return g.response;

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const g = await adminApiGuard(true);
  if (!g.ok) return g.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid blog post payload" }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextPublishedAt =
    parsed.data.published && !existing.published
      ? new Date()
      : parsed.data.published
        ? existing.publishedAt ?? new Date()
        : null;

  try {
    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        slug: parsed.data.slug,
        titleEn: parsed.data.titleEn,
        titleLv: parsed.data.titleLv,
        excerptEn: parsed.data.excerptEn?.trim() || null,
        excerptLv: parsed.data.excerptLv?.trim() || null,
        htmlEn: parsed.data.htmlEn || null,
        htmlLv: parsed.data.htmlLv || null,
        designJsonEn: (parsed.data.designJsonEn ?? null) as Prisma.InputJsonValue,
        designJsonLv: (parsed.data.designJsonLv ?? null) as Prisma.InputJsonValue,
        coverImageUrl: parsed.data.coverImageUrl?.trim() || null,
        published: parsed.data.published,
        publishedAt: nextPublishedAt,
      },
    });

    await writeAuditLog(g.user.id, "blog_post.updated", "BlogPost", updated.id, {
      slug: updated.slug,
      published: updated.published,
    });

    return NextResponse.json({ post: updated });
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}
