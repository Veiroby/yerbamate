import { describe, expect, it } from "vitest";
import {
  computeRegisteredParcelEur,
  DEFAULT_EU_REGISTERED_PARCEL_RATES,
} from "./latvijas-pasts-eu-rates";

describe("computeRegisteredParcelEur", () => {
  const de = DEFAULT_EU_REGISTERED_PARCEL_RATES.DE;

  it("charges the up-to-500g band for total mass up to 500 g", () => {
    expect(computeRegisteredParcelEur(de, 0.5)).toBe(10.72);
    expect(computeRegisteredParcelEur(de, 0.25)).toBe(10.72);
  });

  it("charges the 501g–1000g band for mass in the second half of the first kg", () => {
    expect(computeRegisteredParcelEur(de, 0.501)).toBe(17.89);
    expect(computeRegisteredParcelEur(de, 1)).toBe(17.89);
  });

  it("adds per-kg surcharge above 1 kg", () => {
    expect(computeRegisteredParcelEur(de, 2)).toBeCloseTo(17.89 + 2.37, 5);
  });
});
