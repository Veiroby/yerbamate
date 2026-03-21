import en from "@/locales/en.json";
import lv from "@/locales/lv.json";

type Dict = Record<string, string>;

function dictForPath(pathname: string): Dict {
  if (pathname.startsWith("/lv")) return lv as Dict;
  return en as Dict;
}

/** Resolves locale prefix and cart toast strings from the current URL (client-only for pathname). */
export function getAddToCartToastCopy(pathname?: string): {
  title: string;
  viewCart: string;
  addError: string;
  cartHref: string;
} {
  const path =
    typeof window !== "undefined" ? window.location.pathname : (pathname ?? "/en");
  const dict = dictForPath(path);
  const m = path.match(/^\/(lv|en)(?:\/|$)/);
  const prefix = m ? `/${m[1]}` : "/en";

  return {
    title: dict["cart.addedToCartTitle"] ?? "Added to cart",
    viewCart: dict["cart.viewCartCta"] ?? "View cart",
    addError: dict["cart.addToCartError"] ?? "Could not add this item to your cart.",
    cartHref: `${prefix}/cart`,
  };
}
