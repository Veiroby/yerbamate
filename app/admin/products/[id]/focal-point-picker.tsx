"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

type Props = {
  imageUrl: string;
  alt: string;
  initialX: number;
  initialY: number;
  fieldNameX: string;
  fieldNameY: string;
};

export function FocalPointPicker({
  imageUrl,
  alt,
  initialX,
  initialY,
  fieldNameX,
  fieldNameY,
}: Props) {
  const [point, setPoint] = useState<{ x: number; y: number }>({
    x: clamp(initialX),
    y: clamp(initialY),
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = clamp((event.clientY - rect.top) / rect.height);
      setPoint({ x, y });
    },
    [],
  );

  const xPercent = Math.round(point.x * 100);
  const yPercent = Math.round(point.y * 100);

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-square w-32 cursor-crosshair overflow-hidden rounded-xl border border-zinc-300 bg-zinc-100"
        onClick={handleClick}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="128px"
          unoptimized
          style={{ objectPosition: `${xPercent}% ${yPercent}%` }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/60 shadow"
            style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span>
          Focal point: {xPercent}% / {yPercent}%
        </span>
      </div>
      <input type="hidden" name={fieldNameX} value={point.x.toString()} />
      <input type="hidden" name={fieldNameY} value={point.y.toString()} />
    </div>
  );
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

