"use client";

import { useTransition } from "react";

type Props = {
  productId: string;
  productName: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteProductButton({
  productId,
  productName,
  deleteAction,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    const formData = new FormData();
    formData.set("productId", productId);

    startTransition(() => deleteAction(formData));
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}
