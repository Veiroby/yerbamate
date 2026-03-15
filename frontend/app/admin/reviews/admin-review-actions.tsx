"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  reviewId: string;
  status: string;
  productSlug: string;
};

export function AdminReviewActions({ reviewId, status, productSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {status === "PENDING" && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={!!loading}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "approve" ? "…" : "Approve"}
        </button>
      )}
      <a
        href={`/products/${encodeURIComponent(productSlug)}#reviews-heading`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        View on product
      </a>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!!loading}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {loading === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
