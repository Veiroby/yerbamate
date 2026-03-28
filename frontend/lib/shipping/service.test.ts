import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getAvailableShippingMethods } from "./service";
import { LP_REGISTERED_PREFIX } from "./latvijas-pasts-eu-rates";

vi.mock("./settings", async () => {
  const { mergeEuRegisteredParcelRates } = await import("./latvijas-pasts-eu-rates");
  return {
    getShippingSettings: vi.fn(async () => ({
      freeShippingThreshold: null,
      freeShippingCurrency: "EUR",
      dpdPriceByCountry: { LV: 4.99, EE: 5.99, LT: 4.99 },
      euRegisteredParcelRatesRaw: null,
      euRegisteredParcelRates: mergeEuRegisteredParcelRates(null),
    })),
    saveShippingSettings: vi.fn(),
  };
});

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      shippingZone: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "zone-us",
            name: "United States",
            countries: ["US"],
          },
        ]),
      },
      shippingMethod: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "standard",
            name: "Standard",
            rateConfig: { amount: 7 },
            estimatedDays: 5,
            active: true,
            zoneId: "zone-us",
            type: "FLAT",
          },
        ]),
      },
      cartItem: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  };
});

describe("shipping service", () => {
  beforeEach(() => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);
  });

  it("returns configured methods for matching zone", async () => {
    const methods = await getAvailableShippingMethods(
      { country: "US" },
      { id: "cart1" },
    );

    expect(methods).toHaveLength(1);
    expect(methods[0]).toMatchObject({
      id: "standard",
      name: "Standard",
      amount: 7,
    });
  });

  it("returns no methods for unsupported countries (e.g. GB)", async () => {
    const methods = await getAvailableShippingMethods(
      { country: "GB" },
      { id: "cart1" },
    );

    expect(methods).toHaveLength(0);
  });

  it("adds Latvijas Pasts registered option for Germany with default 1 kg billing weight", async () => {
    const methods = await getAvailableShippingMethods(
      { country: "DE" },
      { id: "cart1" },
      null,
      "en",
    );

    const lp = methods.find((m) => m.id === `${LP_REGISTERED_PREFIX}DE`);
    expect(lp).toBeDefined();
    expect(lp?.amount).toBe(17.89);
  });

  it("uses the up-to-500g band for Germany when cart total mass is 500 g", async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValueOnce([
      {
        quantity: 1,
        product: { shippingWeightKg: 0.5, weight: null },
      },
    ]);

    const methods = await getAvailableShippingMethods(
      { country: "DE" },
      { id: "cart1" },
      null,
      "en",
    );

    const lp = methods.find((m) => m.id === `${LP_REGISTERED_PREFIX}DE`);
    expect(lp?.amount).toBe(10.72);
  });
});
