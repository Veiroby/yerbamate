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
  /** Product description – shown below price, Figma style */
  description?: string | null;
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
  description = null,
  backgroundColor,
  textColor = "text-[#283618]",
  productId,
  productSlug,
}: PromoBlockProps) {
  const hasProductActions = productId != null && productSlug != null;

  return (
    <div className={`flex min-h-[220px] flex-row md:min-h-[340px] lg:min-h-[380px] md:flex-row md:items-stretch ${backgroundColor}`}>
      {/* Image on the left – minimal padding so product fills space (Figma: no extra space around image) */}
      <Link
        href={href}
        className="flex shrink-0 items-center justify-center p-2 sm:p-3 md:p-4"
      >
        {imageUrl ? (
          <div className="relative h-48 w-48 overflow-hidden sm:h-64 sm:w-64 md:h-[280px] md:w-[280px] lg:h-[326px] lg:w-[326px]">
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-contain object-center"
              style={{ transform: "scale(1.12)" }}
              sizes="(max-width: 640px) 192px, (max-width: 768px) 256px, (max-width: 1024px) 280px, 326px"
              unoptimized
            />
          </div>
        ) : (
          <div
            className={`flex h-48 w-48 items-center justify-center rounded-lg sm:h-64 sm:w-64 md:h-[280px] md:w-[280px] lg:h-[326px] lg:w-[326px] ${textColor} opacity-20`}
          >
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
              />
            </svg>
          </div>
        )}
      </Link>

      {/* Content: Figma hierarchy – title (largest), price (large bold), description (smaller), buttons (smallest) */}
      <div className="flex flex-1 flex-col justify-center px-4 pb-4 sm:px-6 sm:pb-6 md:py-6 md:pr-6 md:pl-2">
        <h3 className={`text-[1.125rem] font-bold uppercase leading-tight tracking-wide ${textColor} sm:text-xl md:text-2xl`}>
          {title}
        </h3>
        <p className={`mt-1.5 text-base font-bold ${textColor} sm:text-lg`}>{price}</p>
        {description && (
          <p className={`mt-2 line-clamp-3 text-sm font-normal leading-snug ${textColor} opacity-90`}>
            {description}
          </p>
        )}
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
            className={`mt-3 inline-flex w-fit rounded border-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition sm:px-4 sm:py-2.5 sm:text-sm ${textColor === "text-white" ? "border-[#FEFAE0] hover:bg-[#FEFAE0] hover:text-[#283618]" : "border-[#283618] hover:bg-[#283618] hover:text-[#FEFAE0]"}`}
          >
            Shop now
          </Link>
        )}
      </div>
    </div>
  );
}
