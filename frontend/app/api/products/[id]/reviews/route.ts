import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type GetParams = { params: Promise<{ id: string }> };

/** GET: list approved reviews for a product by id */
export async function GET(_request: Request, { params }: GetParams) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, active: true, archived: true },
  });
  if (!product || !product.active || product.archived) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      authorName: true,
      authorEmail: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
    },
  });

  const safeReviews = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName ?? "Anonymous",
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  }));

  const average =
    safeReviews.length > 0
      ? safeReviews.reduce((s, r) => s + r.rating, 0) / safeReviews.length
      : null;
  const count = safeReviews.length;

  return NextResponse.json({
    reviews: safeReviews,
    average: average != null ? Math.round(average * 10) / 10 : null,
    count,
  });
}

/** POST: create a new review (guest or logged-in) */
export async function POST(request: Request, { params }: GetParams) {
  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, active: true, archived: true },
  });
  if (!product || !product.active || product.archived) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rating = typeof (body as any).rating === "number" ? (body as any).rating : Number((body as any).rating);
  const title = typeof (body as any).title === "string" ? (body as any).title.trim().slice(0, 200) : null;
  const textBody = typeof (body as any).body === "string" ? (body as any).body.trim().slice(0, 2000) : null;
  const authorEmail = typeof (body as any).authorEmail === "string" ? (body as any).authorEmail.trim().toLowerCase() : "";
  const authorName = typeof (body as any).authorName === "string" ? (body as any).authorName.trim().slice(0, 100) : null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const email = authorEmail || user?.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      productId: product.id,
      userId: user?.id ?? null,
      authorEmail: email,
      authorName: (authorName || user?.name) ?? null,
      rating,
      title: title || null,
      body: textBody || null,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    id: review.id,
    message: "Thank you! Your review will appear after moderation.",
  });
}
