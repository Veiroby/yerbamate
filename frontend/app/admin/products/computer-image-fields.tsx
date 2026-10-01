"use client";

import { useEffect, useState } from "react";

export function ComputerImageFields({
  name = "images",
  max = 3,
}: {
  name?: string;
  max?: number;
}) {
  const [previews, setPreviews] = useState<{ url: string; label: string }[]>([]);

  useEffect(() => {
    return () => {
      for (const preview of previews) URL.revokeObjectURL(preview.url);
    };
  }, [previews]);

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-2 text-sm text-zinc-700">
        Upload from your computer
        <input
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          multiple
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []).slice(0, max);
            setPreviews(
              files.map((file) => ({
                url: URL.createObjectURL(file),
                label: file.name,
              })),
            );
          }}
        />
      </label>
      <p className="text-xs text-zinc-500">
        JPEG, PNG, WebP, or GIF. Up to {max} photos, 20MB each. Choose a file from your computer — a web address is not used.
      </p>
      {previews.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {previews.map((preview) => (
            <figure key={preview.url} className="w-20">
              {/* Local file preview before the product is saved. */}
              <img
                src={preview.url}
                alt={preview.label}
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-zinc-200"
              />
              <figcaption className="mt-1 truncate text-[10px] text-zinc-500">
                {preview.label}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
