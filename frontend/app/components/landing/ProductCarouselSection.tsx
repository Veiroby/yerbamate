"use client";

import Link from "next/link";
import Image from "next/image";

export type CarouselProduct = {
  title: string;
  price: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
  weight?: string | null;
};

type Props = {
  title: string;
  products: CarouselProduct[];
};

export function ProductCarouselSection({ title, products }: Props) {
  if (products.length === 0) return null;

  const sectionId = title.replace(/\s/g, "-").toLowerCase();

  return (
    <section className="bg-white px-4 py-12 sm:py-16" aria-labelledby={`carousel-${sectionId}`}>
      <div className="mx-auto max-w-6xl">
        <h2
          id={`carousel-${sectionId}`}
          className="mb-8 text-center text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl"
        >
          {title}
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-thin sm:gap-8">
          {products.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md sm:w-[260px] md:w-[300px]"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-gray-50">
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
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-2 text-base font-medium text-gray-900 sm:text-lg">{p.title}</p>
                {p.weight ? (
                  <p className="mt-1 text-sm text-gray-500">{p.weight}</p>
                ) : null}
                <p className="mt-1 text-base font-semibold text-black sm:text-lg">{p.price}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/products"
            className="rounded-full border-2 border-gray-900 px-8 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}
