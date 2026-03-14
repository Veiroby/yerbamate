import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-white px-4 py-12 sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        <div className="flex-1">
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-tight text-black sm:text-5xl md:text-6xl lg:text-[3.5rem]"
          >
            Find mate that matches your style
          </h1>
          <p className="mt-4 max-w-lg text-base text-gray-600 sm:text-lg">
            Premium yerba mate and gourds. Quality you can taste, delivered to your door.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-md bg-black px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Shop now
          </Link>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className="text-2xl font-bold text-black">200+</p>
              <p className="mt-1 text-sm text-gray-600">International brands</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black">2,000+</p>
              <p className="mt-1 text-sm text-gray-600">High quality products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black">30,000+</p>
              <p className="mt-1 text-sm text-gray-600">Happy customers</p>
            </div>
          </div>
        </div>
        <div className="relative flex-1">
          <div className="aspect-square max-w-md rounded-2xl bg-gray-100" />
        </div>
      </div>
    </section>
  );
}
