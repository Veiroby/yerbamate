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
  initialZoom?: number;
  fieldNameZoom?: string;
};

export function FocalPointPicker({
  imageUrl,
  alt,
  initialX,
  initialY,
  fieldNameX,
  fieldNameY,
  initialZoom = 1,
  fieldNameZoom = "zoom",
}: Props) {
  const [point, setPoint] = useState<{ x: number; y: number }>({
    x: clamp(initialX),
    y: clamp(initialY),
  });
  const [zoom, setZoom] = useState<number>(clampZoom(initialZoom));
  const [isOpen, setIsOpen] = useState(false);

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
        onClick={(event) => {
          handleClick(event);
          setIsOpen(true);
        }}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover transition-transform duration-150"
          sizes="128px"
          unoptimized
          style={{
            objectPosition: `${xPercent}% ${yPercent}%`,
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          }}
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
      <div className="space-y-1 text-[11px] text-zinc-500">
        <div className="flex items-center justify-between">
          <span>Zoom</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={2}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(clampZoom(Number.parseFloat(e.target.value)))}
          className="w-full accent-zinc-700"
        />
      </div>
      <input type="hidden" name={fieldNameX} value={point.x.toString()} />
      <input type="hidden" name={fieldNameY} value={point.y.toString()} />
      {fieldNameZoom && (
        <input type="hidden" name={fieldNameZoom} value={zoom.toString()} />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              Adjust image crop &amp; position
            </h3>
            <div
              className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-xl border border-zinc-300 bg-zinc-100"
              onClick={handleClick}
            >
              <Image
                src={imageUrl}
                alt={alt}
                fill
                className="object-cover transition-transform duration-150"
                sizes="512px"
                unoptimized
                style={{
                  objectPosition: `${xPercent}% ${yPercent}%`,
                  transform: zoom !== 1 ? `scale(zoom)` : undefined,
                }}
              />
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/60 shadow"
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                />
              </div>
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-zinc-500">
              <div className="flex items-center justify-between">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={2}
                step={0.05}
                value={zoom}
                onChange={(e) =>
                  setZoom(clampZoom(Number.parseFloat(e.target.value)))
                }
                className="w-full accent-zinc-700"
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                Click on the image to move the focus point. Use the slider to
                zoom in for a tighter crop.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clampZoom(value: number): number {
  if (Number.isNaN(value)) return 1;
  if (value < 1) return 1;
  if (value > 2) return 2;
  return value;
}

