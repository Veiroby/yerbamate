import { prisma } from "@/lib/db";
import {
  DPD_PARCEL_MACHINE_METHOD_ID,
  isDpdAvailableForCountry,
} from "./dpd";
import { getCartBillingWeightKg } from "./cart-weight";
import { LOCAL_PICKUP_METHOD_ID } from "./local-pickup";
import { getShippingSettings } from "./settings";
import {
  computeRegisteredParcelEur,
  isEuLatvijasPastsPostalDestination,
  LP_REGISTERED_PREFIX,
  roundShippingEur,
} from "./latvijas-pasts-eu-rates";

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
  locale?: "lv" | "en",
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

  if (isDpdAvailableForCountry(countryCode)) {
    options.push({
      id: DPD_PARCEL_MACHINE_METHOD_ID,
      name: locale === "lv" ? "DPD pakomāts" : "DPD parcel machine",
      amount: freeShippingApplies ? 0 : dpdAmount,
      estimatedDays: 3,
    });
  }

  if (countryCode === "LV") {
    options.push({
      id: LOCAL_PICKUP_METHOD_ID,
      name:
        locale === "lv"
          ? "Saņemšana uz vietas (Stabu iela 53, Rīga)"
          : "Local pick-up (Stabu iela 53, Rīga)",
      amount: 0,
      estimatedDays: null,
    });
  }

  if (isEuLatvijasPastsPostalDestination(countryCode)) {
    const pair = settings.euRegisteredParcelRates[countryCode];
    if (pair) {
      const billingKg = await getCartBillingWeightKg(cart?.id);
      const rawEur = computeRegisteredParcelEur(pair, billingKg);
      const amount = roundShippingEur(rawEur);
      options.push({
        id: `${LP_REGISTERED_PREFIX}${countryCode}`,
        name:
          locale === "lv"
            ? `Latvijas Pasts — reģistrēta paka (${countryCode})`
            : `Latvijas Pasts — registered parcel (${countryCode})`,
        amount: freeShippingApplies ? 0 : amount,
        estimatedDays: 7,
      });
    }
  }

  return options;
}

export type ShippingOrderCalculation = {
  option: ShippingOption | null;
  amount: number;
  /** True when destination has no shipping methods at all. */
  noMethods?: boolean;
  /** True when client sent a shipping option id that is not valid for this destination/cart. */
  invalidSelection?: boolean;
};

export async function calculateShippingForOrder(
  destination: Destination,
  cart: CartForShipping | null,
  selectedOptionId?: string | null,
  orderSubtotal?: number | null,
  locale?: "lv" | "en",
): Promise<ShippingOrderCalculation> {
  const options = await getAvailableShippingMethods(
    destination,
    cart,
    orderSubtotal,
    locale,
  );

  if (options.length === 0) {
    return {
      option: null,
      amount: 0,
      noMethods: true,
    };
  }

  if (selectedOptionId) {
    const found = options.find((opt) => opt.id === selectedOptionId);
    if (!found) {
      return { option: null, amount: 0, invalidSelection: true };
    }
    return {
      option: found,
      amount: found.amount,
    };
  }

  const chosen = options[0];
  return {
    option: chosen,
    amount: chosen.amount,
  };
}
