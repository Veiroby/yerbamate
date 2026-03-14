"use client";

import Link from "next/link";
import Image from "next/image";

export type CarouselProduct = {
  title: string;
  price: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
};

type Props = {
  title: string;
  products: CarouselProduct[];
};

export function ProductCarouselSection({ title, products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="bg-white px-4 py-12 sm:py-16" aria-labelledby={`carousel-${title.replace(/\s/g, "-")}`}>
      <div className="mx-auto max-w-6xl">
        <h2
          id={`carousel-${title.replace(/\s/g, "-")}`}
          className="mb-8 text-center text-xl font-bold uppercase tracking-wide text-gray-900 sm:text-2xl"
        >
          {title}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin sm:gap-6">
          {products.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex w-[160px] shrink-0 flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:w-[180px]"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-50">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt || p.title}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="180px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-900">{p.title}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{p.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
