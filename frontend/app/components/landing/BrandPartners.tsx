const partners = ["Partner one", "Partner two", "Partner three", "Partner four", "Partner five"];

export function BrandPartners() {
  return (
    <section className="bg-[#606C38]/10 px-4 py-10 sm:py-14" aria-label="Brand partners">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {partners.map((name) => (
            <div
              key={name}
              className="flex h-12 items-center justify-center px-6 text-sm font-medium uppercase tracking-wider text-[#606C38]"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
