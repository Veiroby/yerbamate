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
  textColor = "text-[#283618]",
  productId,
  productSlug,
}: PromoBlockProps) {
  const hasProductActions = productId != null && productSlug != null;

  return (
    <div className={`flex min-h-[180px] flex-row md:min-h-[220px] md:flex-row md:items-stretch ${backgroundColor}`}>
      {/* Image on the left – tighter layout, less padding */}
      <Link
        href={href}
        className="flex shrink-0 items-center justify-center pl-4 pr-2 py-4 sm:pl-6 sm:pr-3 sm:py-4 md:pl-8 md:pr-4 md:py-5"
      >
        {imageUrl ? (
          <div className="relative h-28 w-24 sm:h-32 sm:w-28 md:h-36 md:w-32">
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-contain object-center"
              sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
              unoptimized
            />
          </div>
        ) : (
          <div className={`flex h-28 w-24 items-center justify-center rounded-lg sm:h-32 sm:w-28 md:h-36 md:w-32 ${textColor} opacity-20`}>
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
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
            buttonClass={textColor === "text-white" ? "bg-[#FEFAE0] text-[#283618] hover:bg-[#FEFAE0]/90" : "bg-[#283618] text-[#FEFAE0] hover:bg-[#283618]/90"}
            outlineClass={textColor === "text-white" ? "border-2 border-[#FEFAE0] text-[#FEFAE0] hover:bg-[#FEFAE0]/10" : "border-2 border-[#283618] text-[#283618] hover:bg-[#283618]/5"}
          />
        ) : (
          <Link
            href={href}
            className={`mt-4 inline-flex w-fit rounded border-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${textColor === "text-white" ? "border-[#FEFAE0] hover:bg-[#FEFAE0] hover:text-[#283618]" : "border-[#283618] hover:bg-[#283618] hover:text-[#FEFAE0]"}`}
          >
            Shop now
          </Link>
        )}
      </div>
    </div>
  );
}
