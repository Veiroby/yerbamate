import { chargedUnitPrice } from "@/lib/product-price";
import type { TgProduct } from "./types";

export function productUnitPrice(product: TgProduct): number {
  return chargedUnitPrice(product.price, product.bottleDeposit);
}

export function formatMoney(amount: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("lv-LV", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
}
