import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { EuRegisteredParcelRate } from "./latvijas-pasts-eu-rates";
import { mergeEuRegisteredParcelRates } from "./latvijas-pasts-eu-rates";

export type DpdPriceByCountry = Record<string, number>;

export type ShippingSettingsResult = {
  freeShippingThreshold: number | null;
  freeShippingCurrency: string;
  dpdPriceByCountry: DpdPriceByCountry;
  /** Raw DB JSON; null means use built-in Latvijas Pasts defaults only. */
  euRegisteredParcelRatesRaw: unknown | null;
  /** Effective per-country registered parcel rates (defaults + validated merge). */
  euRegisteredParcelRates: Record<string, EuRegisteredParcelRate>;
};

const DPD_DEFAULT_PRICE = 4.99;
const DPD_COUNTRIES = ["LV", "EE", "LT"] as const;

export async function getShippingSettings(): Promise<ShippingSettingsResult> {
  const row = await prisma.shippingSettings.findUnique({
    where: { id: "default" },
  });
  const threshold = row?.freeShippingThreshold != null ? Number(row.freeShippingThreshold) : null;
  const currency = row?.freeShippingCurrency ?? "EUR";
  const raw = (row?.dpdPriceByCountry ?? null) as DpdPriceByCountry | null;
  const dpdPriceByCountry: DpdPriceByCountry = {};
  for (const c of DPD_COUNTRIES) {
    dpdPriceByCountry[c] = raw?.[c] ?? (typeof process.env.DPD_SHIPPING_PRICE !== "undefined" ? Number(process.env.DPD_SHIPPING_PRICE) : DPD_DEFAULT_PRICE);
  }
  if (raw) {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "number" && !Object.prototype.hasOwnProperty.call(dpdPriceByCountry, k)) {
        dpdPriceByCountry[k] = v;
      }
    }
  }
  const euRaw = row?.euRegisteredParcelRates ?? null;
  const euRegisteredParcelRates = mergeEuRegisteredParcelRates(euRaw);
  return {
    freeShippingThreshold: threshold,
    freeShippingCurrency: currency,
    dpdPriceByCountry,
    euRegisteredParcelRatesRaw: euRaw,
    euRegisteredParcelRates,
  };
}

export async function saveShippingSettings(data: {
  freeShippingThreshold: number | null;
  freeShippingCurrency: string;
  dpdPriceByCountry: DpdPriceByCountry;
  euRegisteredParcelRates: Record<string, EuRegisteredParcelRate> | null;
}): Promise<void> {
  await prisma.shippingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      freeShippingThreshold: data.freeShippingThreshold,
      freeShippingCurrency: data.freeShippingCurrency || "EUR",
      dpdPriceByCountry: data.dpdPriceByCountry as object,
      euRegisteredParcelRates:
        data.euRegisteredParcelRates != null
          ? (data.euRegisteredParcelRates as Prisma.InputJsonValue)
          : undefined,
    },
    update: {
      freeShippingThreshold: data.freeShippingThreshold,
      freeShippingCurrency: data.freeShippingCurrency || "EUR",
      dpdPriceByCountry: data.dpdPriceByCountry as object,
      euRegisteredParcelRates:
        data.euRegisteredParcelRates != null
          ? (data.euRegisteredParcelRates as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });
}
