import Link from "next/link";

const heroBg = "bg-amber-700"; // dark gold

export function Hero() {
  return (
    <section
      className={`relative overflow-hidden ${heroBg} px-4 py-10 sm:py-14 md:flex md:min-h-[320px] md:items-center md:justify-between md:gap-8 md:px-8 lg:px-12`}
      aria-labelledby="hero-heading"
    >
      <div className="flex flex-1 flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
        {/* Left: vertical text + product image area */}
        <div className="flex items-center gap-6 md:gap-10">
          <p
            className="origin-left -rotate-90 whitespace-nowrap text-sm font-bold uppercase tracking-widest text-white opacity-90"
            aria-hidden
          >
            Back in stock
          </p>
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg bg-white/10 sm:h-52 sm:w-52 md:h-44 md:w-44">
            <span className="text-sm text-white/60">Product image</span>
          </div>
        </div>

        {/* Right: headline + price */}
        <div className="flex flex-1 flex-col justify-center">
          <h1
            id="hero-heading"
            className="text-3xl font-bold uppercase leading-tight text-white sm:text-4xl md:text-5xl"
          >
            Premium mate &amp; gourds
          </h1>
          <p className="mt-2 text-lg text-white/95">Quality you can taste.</p>
          <p className="mt-4 text-2xl font-semibold text-white">From €9.99</p>
          <Link
            href="/products"
            className="mt-6 inline-flex w-fit rounded border-2 border-white bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-amber-800"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>
  );
}
