import { describe, expect, it } from "vitest";
import { parseLooseWeightKg } from "./parse-product-weight-kg";

describe("parseLooseWeightKg", () => {
  it("parses grams with g attached to digits (regression: 500g was 500 kg)", () => {
    expect(parseLooseWeightKg("500g")).toBe(0.5);
    expect(parseLooseWeightKg("500 g")).toBe(0.5);
    expect(parseLooseWeightKg("250G")).toBe(0.25);
  });

  it("parses kilograms with or without space", () => {
    expect(parseLooseWeightKg("1 kg")).toBe(1);
    expect(parseLooseWeightKg("1kg")).toBe(1);
    expect(parseLooseWeightKg("0,5 kg")).toBe(0.5);
  });

  it("parses bare gram-style integers as grams", () => {
    expect(parseLooseWeightKg("500")).toBe(0.5);
    expect(parseLooseWeightKg("1000")).toBe(1);
  });

  it("parses bare small integers as kilograms", () => {
    expect(parseLooseWeightKg("1")).toBe(1);
    expect(parseLooseWeightKg("2")).toBe(2);
  });

  it("parses bare decimals as kilograms", () => {
    expect(parseLooseWeightKg("0.5")).toBe(0.5);
  });
});
