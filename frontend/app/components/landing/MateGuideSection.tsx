import Image from "next/image";
import type { Locale } from "@/lib/locale";
import { createT, getTranslations } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

export async function MateGuideSection({ locale }: Props) {
  const translations = await getTranslations(locale);
  const t = createT(translations);

  const isLv = locale === "lv";

  const imageSrc = isLv
    ? "/images/mate-guide-lv.png"
    : "/images/mate-guide-en.png";

  const heading = t("mateGuide.heading");

  const steps = Array.from({ length: 6 }, (_, i) => ({
    n: i + 1,
    text: t(`mateGuide.step${i + 1}`),
  }));

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
          <ul className="list-disc space-y-6 pl-6 text-base text-gray-700">
            {desktopRenderOrder.map((n) => {
              const step = stepsByNumber.get(n);
              if (!step) return null;
              return (
                <li key={n} className="leading-8">
                  {step.text}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

