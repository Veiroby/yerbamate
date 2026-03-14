import Link from "next/link";

const categories = [
  { icon: "Yerba", label: "Yerba Mate" },
  { icon: "☕", label: "Drinks" },
  { icon: "🫖", label: "Gourds" },
  { icon: "📦", label: "Bundles" },
  { icon: "🛍️", label: "Accessories" },
  { icon: "🎁", label: "Gifts" },
];

export function TrendingSection() {
  return (
    <section
      className="bg-white px-4 py-12 sm:py-16"
      aria-labelledby="trending-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="trending-heading"
          className="text-center text-xl font-bold uppercase tracking-wide text-[#283618] sm:text-2xl"
        >
          What&apos;s trending?
        </h2>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {categories.map(({ icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#606C38]/20 text-lg text-[#606C38]">
                {icon}
              </span>
              <span className="text-sm font-medium text-[#283618]">{label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <div className="h-1 w-full max-w-md bg-[#BC6C25]" aria-hidden />
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/products"
            className="rounded border-2 border-[#BC6C25] px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-[#283618] transition hover:bg-[#BC6C25] hover:text-[#FEFAE0]"
          >
            Shop all
          </Link>
        </div>
      </div>
    </section>
  );
}
