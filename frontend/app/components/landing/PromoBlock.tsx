import Link from "next/link";
import Image from "next/image";

export type PromoBlockProps = {
  title: string;
  price: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
  backgroundColor: string; // Tailwind class e.g. bg-violet-200
  textColor?: string;   // default dark
};

export function PromoBlock({
  title,
  price,
  href,
  imageUrl = null,
  imageAlt = "",
  backgroundColor,
  textColor = "text-gray-900",
}: PromoBlockProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col ${backgroundColor} p-6 sm:p-8 md:min-h-[280px] md:flex-1`}
    >
      <h3 className={`text-lg font-bold uppercase tracking-wide ${textColor} sm:text-xl`}>
        {title}
      </h3>
      <div className="relative mt-4 flex flex-1 items-center justify-center min-h-[140px] sm:min-h-[180px]">
        {imageUrl ? (
          <div className="relative h-40 w-40 sm:h-48 sm:w-48">
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-contain"
              sizes="192px"
              unoptimized
            />
          </div>
        ) : (
          <div className={`flex h-32 w-32 items-center justify-center rounded-lg ${textColor} opacity-30`}>
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
      </div>
      <p className={`mt-4 text-lg font-semibold ${textColor}`}>{price}</p>
    </Link>
  );
}
