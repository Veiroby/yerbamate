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
    <section className="bg-[#FEFAE0] px-4 py-12 sm:py-16" aria-labelledby={`carousel-${title.replace(/\s/g, "-")}`}>
      <div className="mx-auto max-w-6xl">
        <h2
          id={`carousel-${title.replace(/\s/g, "-")}`}
          className="mb-8 text-center text-3xl font-bold uppercase tracking-wide text-[#283618] sm:text-4xl md:text-5xl"
        >
          {title}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-thin sm:gap-8">
          {products.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex w-[220px] shrink-0 flex-col bg-transparent transition hover:opacity-95 sm:w-[260px] md:w-[300px]"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-transparent">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt || p.title}
                    fill
                    className="object-contain transition group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 220px, (max-width: 768px) 260px, 300px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#606C38]/30">
                    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="mt-4 line-clamp-2 text-base font-medium text-[#283618] sm:text-lg md:text-xl">{p.title}</p>
              <p className="mt-1 text-base font-semibold text-[#283618] sm:text-lg">{p.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
