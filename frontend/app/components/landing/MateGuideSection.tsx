import Image from "next/image";
import type { Locale } from "@/lib/locale";

type Props = {
  locale: Locale;
};

export function MateGuideSection({ locale }: Props) {
  const isLv = locale === "lv";

  const imageSrc = isLv
    ? "/images/mate-guide-lv.jpg"
    : "/images/mate-guide-en.jpg";

  const heading = isLv
    ? "Kā pagatavot yerba mate tēju"
    : "How to make yerba mate tea";

  const steps = isLv
    ? [
        "Pieber 2/3 trauka ar yerba mate tēju.",
        "Atstāj tēju slīpumā uz 2–3 minūtēm, lai tā piesūcas ar ūdeni.",
        "Izmantojot plaukstu, sakrata trauku, lai smalkākās lapas nonāk augšpusē.",
        "Izmantojot salmiņu, sapresē tēju vienā trauka malā.",
        "Aplej ar 40°–50° siltu ūdeni un pamazām malko.",
        "Aplej tukšo pusi ar 70°–80° siltu ūdeni un baudi, atkārtojot, kamēr ir jūtama garša.",
        "Patīkamu yerba mate piedzīvojumu!",
      ]
    : [
        "Fill 2/3 of the gourd with yerba mate.",
        "Leave the gourd on a 45° angle for 2–3 minutes so the yerba absorbs water.",
        "Cover the top with your palm and shake so the finest dust moves to the top.",
        "Using the straw, press the yerba to one side of the gourd.",
        "Fill with warm water around 40°–50° C and sip slowly.",
        "Pour 70°–80° C hot water into the empty side and enjoy, repeating until there is no taste left.",
        "Enjoy your yerba mate journey!",
      ];

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
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        {/* Hide text on mobile, show on md+ */}
        <div className="hidden w-full md:block md:w-1/2">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl">
            {heading}
          </h2>
          <ol className="space-y-2 text-sm text-gray-700">
            {steps.map((step, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-[2px] inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

