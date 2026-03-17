"use client";

import { useRef, useTransition } from "react";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => deleteAction(formData))}
      className="shrink-0"
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {isPending ? "…" : "Delete"}
      </button>
    </form>
  );
}
