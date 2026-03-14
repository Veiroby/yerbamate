const brands = ["Yerba Mate", "Mate Gourds", "Bombillas", "Accessories", "Blends"];

export function BrandPartners() {
  return (
    <section className="bg-black py-8 sm:py-10" aria-label="Featured brands">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {brands.map((name) => (
            <span
              key={name}
              className="text-sm font-medium uppercase tracking-wider text-white"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
