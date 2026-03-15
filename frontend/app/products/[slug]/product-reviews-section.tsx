"use client";

import { useState } from "react";

type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
};

type Props = {
  productSlug: string;
  productName: string;
  initialReviews: ReviewItem[];
  initialAverage: number | null;
  initialCount: number;
  /** When user is logged in, pre-fill name and email */
  defaultAuthorEmail?: string | null;
  defaultAuthorName?: string | null;
};

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-amber-500" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ProductReviewsSection({
  productSlug,
  productName,
  initialReviews,
  initialAverage,
  initialCount,
  defaultAuthorEmail,
  defaultAuthorName,
}: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [average, setAverage] = useState<number | null>(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorEmail, setAuthorEmail] = useState(defaultAuthorEmail ?? "");
  const [authorName, setAuthorName] = useState(defaultAuthorName ?? "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const displayRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please choose a star rating (1–5).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          body: body.trim() || null,
          authorEmail: authorEmail.trim() || undefined,
          authorName: authorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }
      setSubmitted(true);
      setRating(0);
      setTitle("");
      setBody("");
      setAuthorEmail("");
      setAuthorName("");
    } catch {
      setError("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-12 border-t border-gray-200 pt-10" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-lg font-bold uppercase tracking-wide text-black">
        Reviews
      </h2>

      {count > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StarDisplay rating={Math.round(average ?? 0)} size="md" />
            <span className="text-lg font-semibold text-black">{average?.toFixed(1)}</span>
          </div>
          <span className="text-sm text-gray-500">{count} review{count !== 1 ? "s" : ""}</span>
        </div>
      )}

      <ul className="mt-6 space-y-6">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StarDisplay rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="mt-1 font-medium text-black">{review.authorName}</p>
            {review.title && (
              <p className="mt-1 text-sm font-medium text-gray-900">{review.title}</p>
            )}
            {review.body && (
              <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{review.body}</p>
            )}
          </li>
        ))}
      </ul>

      {reviews.length === 0 && !submitted && (
        <p className="mt-4 text-sm text-gray-500">No reviews yet. Be the first to leave one!</p>
      )}

      {submitted && (
        <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-800">
          Thank you! Your review will appear after moderation.
        </p>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm font-medium text-gray-900">Leave a review</p>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-600">Rating (1–5 stars) *</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="rounded p-0.5 transition hover:opacity-80"
                  aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                  <svg
                    className={`h-8 w-8 ${star <= displayRating ? "text-amber-500" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-title" className="block text-xs font-medium text-gray-600">
              Title (optional)
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              placeholder="Summary of your experience"
            />
          </div>

          <div>
            <label htmlFor="review-body" className="block text-xs font-medium text-gray-600">
              Your review (optional)
            </label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              placeholder="Tell others what you think..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="review-email" className="block text-xs font-medium text-gray-600">
                Email *
              </label>
              <input
                id="review-email"
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="review-name" className="block text-xs font-medium text-gray-600">
                Name (optional)
              </label>
              <input
                id="review-name"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={100}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || rating < 1}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}
