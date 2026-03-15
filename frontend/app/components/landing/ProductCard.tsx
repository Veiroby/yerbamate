"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ProductFavoriteHeart } from "@/app/components/product-favorite-heart";

export type ProductCardProps = {
  title: string;
  description?: string;
  price: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
};

export function ProductCard({
  title,
  description,
  price,
  href,
  imageUrl = null,
  imageAlt = "",
}: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#344e41]/15 bg-white shadow-sm transition hover:shadow-md">
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-[#dad7cd]/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#344e41]/40">
              <svg
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                />
              </svg>
            </div>
          )}
          <ProductFavoriteHeart
            isFavorited={isFavorited}
            onToggle={() => setIsFavorited((v) => !v)}
            className="absolute top-2 right-2 z-10"
          />
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="font-serif text-lg font-semibold text-[#344e41] group-hover:underline">
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-[#344e41]/70">
              {description}
            </p>
          )}
          <p className="mt-auto pt-3 text-base font-semibold text-[#344e41]">
            {price}
          </p>
        </div>
      </Link>
      <div className="border-t border-[#344e41]/10 p-4 pt-0 sm:p-5 sm:pt-0">
        <Link
          href={href}
          className="block w-full rounded-full border-2 border-[#344e41] py-2.5 text-center text-sm font-medium text-[#344e41] transition hover:bg-[#344e41] hover:text-[#dad7cd]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
