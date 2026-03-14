import { describe, expect, it, vi } from "vitest";
import { getAvailableShippingMethods } from "./service";

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
    },
  };
});

describe("shipping service", () => {
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

  it("falls back to default flat rate when no zone matches", async () => {
    const methods = await getAvailableShippingMethods(
      { country: "GB" },
      { id: "cart1" },
    );

    expect(methods.length).toBeGreaterThanOrEqual(1);
    expect(methods[0].amount).toBeGreaterThan(0);
  });
});

