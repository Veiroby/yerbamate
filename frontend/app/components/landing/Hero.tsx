import Link from "next/link";

const heroBg = "bg-[#DDA15E]"; /* Light Caramel */

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
          {/* Figma: hero image 550×550; scale down on smaller screens */}
          <div className="flex h-52 w-52 shrink-0 items-center justify-center rounded-lg bg-white/10 sm:h-72 sm:w-72 md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px] xl:h-[550px] xl:w-[550px]">
            <span className="text-sm text-white/60">Product image</span>
          </div>
        </div>

        {/* Right: headline + price – Figma title ~159px cap, price ~35px */}
        <div className="flex flex-1 flex-col justify-center">
          <h1
            id="hero-heading"
            className="text-3xl font-bold uppercase leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-[3.5rem]"
          >
            Premium mate &amp; gourds
          </h1>
          <p className="mt-2 text-base text-white/95 sm:text-lg">Quality you can taste.</p>
          <p className="mt-4 text-xl font-semibold text-white sm:text-2xl">From €9.99</p>
          <Link
            href="/products"
            className="mt-6 inline-flex w-fit rounded border-2 border-[#283618] bg-transparent px-6 py-2.5 text-sm font-semibold text-[#283618] transition hover:bg-[#283618] hover:text-[#FEFAE0]"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>
  );
}
