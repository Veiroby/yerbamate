"use client";

import type { ReactNode } from "react";

export function ConfirmDeleteImageForm({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Delete this image? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      className="text-xs"
    >
      {children}
    </form>
  );
}
