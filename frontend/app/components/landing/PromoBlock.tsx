import Link from "next/link";
import Image from "next/image";
import { PromoBlockActions } from "./PromoBlockActions";

export type PromoBlockProps = {
  /** Product name used as the section title */
  title: string;
  price: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
  backgroundColor: string;
  textColor?: string;
  /** When set, shows Add to cart + Buy now buttons */
  productId?: string;
  productSlug?: string;
};

export function PromoBlock({
  title,
  price,
  href,
  imageUrl = null,
  imageAlt = "",
  backgroundColor,
  textColor = "text-gray-900",
  productId,
  productSlug,
}: PromoBlockProps) {
  const hasProductActions = productId != null && productSlug != null;

  return (
    <div className={`flex min-h-[280px] flex-col md:min-h-[320px] md:flex-row md:items-stretch ${backgroundColor}`}>
      {/* Image on the left - larger, link to product */}
      <Link
        href={href}
        className="flex shrink-0 items-center justify-center p-6 sm:p-8 md:justify-start"
      >
        {imageUrl ? (
          <div className="relative h-44 w-44 sm:h-52 sm:w-52 md:h-56 md:w-56">
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-contain"
              sizes="224px"
              unoptimized
            />
          </div>
        ) : (
          <div className={`flex h-40 w-40 items-center justify-center rounded-lg sm:h-48 sm:w-48 md:h-56 md:w-56 ${textColor} opacity-20`}>
            <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content on the right: title (product name), price, buttons */}
      <div className="flex flex-1 flex-col justify-center px-6 pb-6 sm:px-8 sm:pb-8 md:py-8 md:pr-8 md:pl-4">
        <h3 className={`text-lg font-bold uppercase tracking-wide ${textColor} sm:text-xl`}>
          {title}
        </h3>
        <p className={`mt-2 text-lg font-semibold ${textColor}`}>{price}</p>
        {hasProductActions ? (
          <PromoBlockActions
            productId={productId}
            productName={title}
            productHref={href}
            buttonClass={textColor === "text-white" ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white hover:bg-gray-800"}
            outlineClass={textColor === "text-white" ? "border-2 border-white text-white hover:bg-white/10" : "border-2 border-gray-900 text-gray-900 hover:bg-gray-100"}
          />
        ) : (
          <Link
            href={href}
            className={`mt-4 inline-flex w-fit rounded border-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${textColor === "text-white" ? "border-white hover:bg-white hover:text-gray-900" : "border-gray-900 hover:bg-gray-900 hover:text-white"}`}
          >
            Shop now
          </Link>
        )}
      </div>
    </div>
  );
}
