import { prisma } from "@/lib/db";
import {
  DPD_PARCEL_MACHINE_METHOD_ID,
  isDpdAvailableForCountry,
} from "./dpd";
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

  if (options.length === 0 && !isDpdAvailableForCountry(countryCode)) {
    options.push({
      id: "standard-flat",
      name: "Standard shipping",
      amount: freeShippingApplies ? 0 : 5,
      estimatedDays: 5,
    });
  }

  if (isDpdAvailableForCountry(countryCode)) {
    options.push({
      id: DPD_PARCEL_MACHINE_METHOD_ID,
      name: "DPD parcel machine",
      amount: freeShippingApplies ? 0 : dpdAmount,
      estimatedDays: 3,
    });
  }

  if (options.length === 0) {
    options.push({
      id: "standard-flat",
      name: "Standard shipping",
      amount: freeShippingApplies ? 0 : 5,
      estimatedDays: 5,
    });
  }

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

