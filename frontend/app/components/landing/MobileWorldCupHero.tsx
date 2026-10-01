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
      className="relative w-full overflow-hidden lg:hidden"
      aria-label={t("hero.imageAlt")}
    >
      <div className="relative aspect-[4/5] w-full">
        <Image
          src="/images/infused-joy-hero.jpg"
          alt={t("hero.imageAlt")}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
    </section>
  );
}
