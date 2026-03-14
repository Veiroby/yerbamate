import { prisma } from "@/lib/db";

export type DpdPriceByCountry = Record<string, number>;

export type ShippingSettingsResult = {
  freeShippingThreshold: number | null;
  freeShippingCurrency: string;
  dpdPriceByCountry: DpdPriceByCountry;
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
  return { freeShippingThreshold: threshold, freeShippingCurrency: currency, dpdPriceByCountry };
}

export async function saveShippingSettings(data: {
  freeShippingThreshold: number | null;
  freeShippingCurrency: string;
  dpdPriceByCountry: DpdPriceByCountry;
}): Promise<void> {
  await prisma.shippingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      freeShippingThreshold: data.freeShippingThreshold,
      freeShippingCurrency: data.freeShippingCurrency || "EUR",
      dpdPriceByCountry: data.dpdPriceByCountry as object,
    },
    update: {
      freeShippingThreshold: data.freeShippingThreshold,
      freeShippingCurrency: data.freeShippingCurrency || "EUR",
      dpdPriceByCountry: data.dpdPriceByCountry as object,
    },
  });
}
