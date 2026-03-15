import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminReviewActions } from "./admin-review-actions";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Reviews</h2>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {reviews.map((review) => (
              <li key={review.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900">
                        {review.product?.name ?? "Unknown product"}
                      </span>
                      <Link
                        href={`/products/${encodeURIComponent(review.product?.slug ?? "")}`}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        View product
                      </Link>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          review.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {review.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
                      <span className="flex gap-0.5" aria-label={`${review.rating} stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= review.rating ? "text-amber-500" : "text-zinc-300"}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                      <span>
                        {review.authorName ?? review.authorEmail} •{" "}
                        {review.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {review.title && (
                      <p className="mt-1 text-sm font-medium text-zinc-800">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{review.body}</p>
                    )}
                  </div>
                  <AdminReviewActions
                    reviewId={review.id}
                    status={review.status}
                    productSlug={review.product?.slug ?? ""}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
