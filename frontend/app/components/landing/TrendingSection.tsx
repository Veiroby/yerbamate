import Link from "next/link";

const benefits = [
  {
    title: "Smooth, clean energy",
    body: "Yerba mate offers a gentle lift without the jitters. Its balanced caffeine and theobromine support focus and alertness, so you stay sharp without the crash.",
  },
  {
    title: "Rich in antioxidants",
    body: "Packed with vitamins, minerals and polyphenols, mate rivals green tea in antioxidant power. A daily cup supports your body’s natural defences and overall wellness.",
  },
  {
    title: "Supports digestion & wellbeing",
    body: "Traditionally enjoyed after meals, yerba mate is known to support healthy digestion. Many find it helps maintain a calm, energised state as part of a mindful daily ritual.",
  },
];

export function TrendingSection() {
  return (
    <section
      className="bg-[#FEFAE0] px-4 py-12 sm:py-16"
      aria-labelledby="why-yerba-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="why-yerba-heading"
          className="text-center text-xl font-bold uppercase tracking-wide text-[#283618] sm:text-2xl"
        >
          Why Yerba Mate is so good for you...
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          {benefits.map(({ title, body }) => (
            <div
              key={title}
              className="flex max-w-3xl flex-col gap-3 sm:mx-0 sm:max-w-none"
            >
              <h3 className="text-lg font-semibold text-[#283618]">{title}</h3>
              <p className="leading-relaxed text-[#606C38]">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <div className="h-1 w-full max-w-md bg-[#BC6C25]" aria-hidden />
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/products"
            className="rounded border-2 border-[#BC6C25] px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-[#283618] transition hover:bg-[#BC6C25] hover:text-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#BC6C25] focus:ring-offset-2 focus:ring-offset-[#FEFAE0]"
          >
            Shop all
          </Link>
        </div>
      </div>
    </section>
  );
}
