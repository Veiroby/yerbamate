import Link from "next/link";
import type { Locale } from "@/lib/locale";

const categories = [
  { path: "products?category=yerba-mate", label: "Yerba Mate" },
  { path: "products?category=mate-gourds", label: "Mate Gourds" },
  { path: "products", label: "Blends" },
  { path: "products", label: "Accessories" },
];

export function BrowseByCategory({ locale }: { locale: Locale }) {
  const prefix = `/${locale}/`;
  return (
    <section className="bg-white px-4 py-12 sm:py-16" aria-labelledby="browse-heading">
      <div className="mx-auto max-w-6xl">
        <h2
          id="browse-heading"
          className="mb-8 text-center text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl"
        >
          Browse by category
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ path, label }) => (
            <Link
              key={label}
              href={prefix + path}
              className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/5] flex items-end p-6 transition hover:bg-gray-200"
            >
              <span className="text-lg font-semibold text-gray-900 group-hover:underline">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
