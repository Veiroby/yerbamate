import Image from "next/image";
import type { Locale } from "@/lib/locale";
import { createT, getTranslations } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

export async function MobileWorldCupHero({ locale }: Props) {
  const translations = await getTranslations(locale);
  const t = createT(translations);

  return (
    <section
      className="relative w-full overflow-hidden pb-6 lg:hidden"
      aria-label="WORLDCUP15 promotion"
    >
      <div className="relative h-[min(68vh,580px)] w-full min-h-[300px]">
        <Image
          src="/images/worldcup15-hero.png"
          alt="Yerba mate World Cup celebration"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/20" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <p className="text-center text-4xl font-black tracking-[0.2em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-5xl">
            WORLDCUP15
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-5 pt-10">
          <p className="text-center text-sm font-semibold leading-snug text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] sm:text-base">
            {t("hero.worldCupDiscount")}
          </p>
        </div>
      </div>
    </section>
  );
}
