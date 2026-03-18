import Image from "next/image";
import type { Locale } from "@/lib/locale";

type Props = {
  locale: Locale;
};

export function MateGuideSection({ locale }: Props) {
  const isLv = locale === "lv";

  const imageSrc = isLv
    ? "/images/mate-guide-lv.png"
    : "/images/mate-guide-en.png";

  const heading = isLv
    ? "Kā pagatavot yerba mate tēju"
    : "How to make yerba mate";

  const steps = isLv
    ? [
        { n: 1, text: "Pieber 2/3 trauka ar yerba mate tēju." },
        {
          n: 2,
          text: "Izmantojot plaukstu, sakrata tēju lai smalkākās lapas nonāk augšpusē.",
        },
        { n: 3, text: "Aplej ar silto ūdeni." },
        {
          n: 4,
          text: "Atstāj tēju slīpumā uz 2–3 minūtēm, sacietēti.",
        },
        { n: 5, text: "Izmantojot salmiņu, sapresē tēju vienā sānā." },
        {
          n: 6,
          text: "Aplej ar 70–80 grādu siltu ūdeni un uzreiz baudi, atkārto kamēr ir jūtama garša.",
        },
      ]
    : [
        { n: 1, text: "Fill 2/3 of gourd with yerba mate." },
        {
          n: 2,
          text: "Using palm cover the gourd and shake to collect all the dust from leaves.",
        },
        { n: 3, text: "Fill with warm water." },
        { n: 4, text: "Leave the gourd on 45 degree slant for yerba to absorb water." },
        { n: 5, text: "Using straw press yerba to the one side of the gourd." },
        {
          n: 6,
          text: "Fill the empty side with 70–80 degree hot water and enjoy straightaway, repeat until no taste.",
        },
      ];

  const desktopRenderOrder = [1, 4, 2, 5, 3, 6];
  const stepsByNumber = new Map(steps.map((s) => [s.n, s]));

  return (
    <section className="bg-white px-4 py-12 sm:py-16" aria-label={heading}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row md:items-start">
        <div className="w-full md:w-1/2">
          <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl bg-[#f5f5f0] shadow-md">
            <Image
              src={imageSrc}
              alt={heading}
              width={960}
              height={768}
              sizes="(max-width: 768px) 100vw, 480px"
              className="h-auto w-full object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Hide text on mobile, show on md+ */}
        <div className="hidden w-full md:block md:w-1/2">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl">
            {heading}
          </h2>
          <ol className="grid grid-cols-2 gap-x-10 gap-y-8 text-base text-gray-700">
            {desktopRenderOrder.map((n) => {
              const step = stepsByNumber.get(n);
              if (!step) return null;
              return (
                <li key={n}>
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold text-[#b08d59]">{step.n}</span>
                    <span className="leading-relaxed">{step.text}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

