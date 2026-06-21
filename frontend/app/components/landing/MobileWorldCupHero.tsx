import Image from "next/image";

export function MobileWorldCupHero() {
  return (
    <section
      className="relative w-full overflow-hidden lg:hidden"
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
        <div
          className="absolute inset-0 bg-black/20"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <p className="text-center text-4xl font-black tracking-[0.2em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-5xl">
            WORLDCUP15
          </p>
        </div>
      </div>
    </section>
  );
}
