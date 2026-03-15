import Image from "next/image";
import Link from "next/link";

type HeroProps = {
  productCount: number;
  brandCount: number;
  customerCount: number;
};

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

export function Hero({ productCount, brandCount, customerCount }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden bg-white px-4 py-12 sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        <div className="flex-1">
          <div className="hidden sm:block">
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
          </div>
          <div className="flex flex-row items-center justify-between gap-3 sm:mt-12 sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-lg font-bold text-black sm:text-2xl">{formatStat(brandCount)}</p>
              <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">International brands</p>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-lg font-bold text-black sm:text-2xl">{formatStat(productCount)}</p>
              <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">High quality products</p>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-lg font-bold text-black sm:text-2xl">{formatStat(customerCount)}</p>
              <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">Happy customers</p>
            </div>
          </div>
        </div>
        <div className="relative hidden flex-1 md:block">
          <div className="relative aspect-square max-w-md overflow-hidden rounded-2xl">
            <Image
              src="/hero-mate.png"
              alt="Pouring hot water from a thermos into a yerba mate gourd"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 28rem"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
