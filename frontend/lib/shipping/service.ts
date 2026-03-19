import { prisma } from "@/lib/db";
import {
  DPD_PARCEL_MACHINE_METHOD_ID,
  isDpdAvailableForCountry,
} from "./dpd";
import { LOCAL_PICKUP_METHOD_ID } from "./local-pickup";
import { getShippingSettings } from "./settings";

type Destination = {
  country: string;
};

type CartForShipping = {
  id: string;
};

export type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  estimatedDays?: number | null;
};

export async function getAvailableShippingMethods(
  destination: Destination,
  cart: CartForShipping | null,
  orderSubtotal?: number | null,
): Promise<ShippingOption[]> {
  const countryCode = destination.country.toUpperCase();
  const options: ShippingOption[] = [];
  const settings = await getShippingSettings();
  const freeShippingApplies =
    orderSubtotal != null &&
    settings.freeShippingThreshold != null &&
    orderSubtotal >= settings.freeShippingThreshold;
  const dpdAmount = settings.dpdPriceByCountry[countryCode] ?? settings.dpdPriceByCountry["LV"] ?? 4.99;

  const zones = await prisma.shippingZone.findMany();

  const matchingZone =
    zones.find((zone) => {
      const countries = (zone.countries as unknown as string[]) ?? [];
      return countries.includes(countryCode);
    }) ?? null;

  // Rates are determined by country: zone methods for that country, or DPD for Baltics.
  // If the country is in no zone and not DPD-eligible, we do not ship there.
  if (matchingZone) {
    const methods = await prisma.shippingMethod.findMany({
      where: {
        zoneId: matchingZone.id,
        active: true,
      },
    });

    if (methods.length > 0) {
      methods.forEach((method) => {
        const config = method.rateConfig as unknown as {
          amount?: number;
        };
        options.push({
          id: method.id,
          name: method.name,
          amount: freeShippingApplies ? 0 : (config.amount ?? 5),
          estimatedDays: method.estimatedDays,
        });
      });
    }
  }

  if (isDpdAvailableForCountry(countryCode)) {
    options.push({
      id: DPD_PARCEL_MACHINE_METHOD_ID,
      name: "DPD parcel machine",
      amount: freeShippingApplies ? 0 : dpdAmount,
      estimatedDays: 3,
    });
  }

  // Free local pickup in Riga for Latvia orders.
  if (countryCode === "LV") {
    options.push({
      id: LOCAL_PICKUP_METHOD_ID,
      name: "Local pick-up (Stabu iela 53, Rīga)",
      amount: 0,
      estimatedDays: null,
    });
  }

  // No fallback for unsupported countries: return empty so UI can show "we don't ship to your country"
  return options;
}

export async function calculateShippingForOrder(
  destination: Destination,
  cart: CartForShipping | null,
  selectedOptionId?: string | null,
  orderSubtotal?: number | null,
) {
  const options = await getAvailableShippingMethods(
    destination,
    cart,
    orderSubtotal,
  );

  if (options.length === 0) {
    return {
      option: null,
      amount: 0,
    };
  }

  const chosen =
    options.find((opt) => opt.id === selectedOptionId) ?? options[0];

  return {
    option: chosen,
    amount: chosen.amount,
  };
}

