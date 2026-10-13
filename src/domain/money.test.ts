import { describe, expect, it } from "vitest";
import { formatMoney, parseMajorToMinor, toUsdMinor } from "./money";

describe("parseMajorToMinor", () => {
  it("accepts whole and two-decimal amounts", () => {
    expect(parseMajorToMinor("120000")).toBe(12000000);
    expect(parseMajorToMinor("120000.5")).toBe(12000050);
    expect(parseMajorToMinor(" 1,200.50 ")).toBe(120050);
  });

  it("rejects blanks, extra precision, and zero", () => {
    expect(parseMajorToMinor("")).toBeNull();
    expect(parseMajorToMinor("10.999")).toBeNull();
    expect(parseMajorToMinor("0")).toBeNull();
    expect(parseMajorToMinor("-5")).toBeNull();
  });
});

describe("toUsdMinor", () => {
  it("rounds the rate conversion to the nearest minor unit", () => {
    expect(toUsdMinor(10000, 1)).toBe(10000);
    expect(toUsdMinor(2_333_333_00, 0.012)).toBe(Math.round(2_333_333_00 * 0.012));
  });
});

describe("formatMoney", () => {
  it("formats minor units as currency", () => {
    expect(formatMoney(12000050, "USD", 2)).toBe("$120,000.50");
    expect(formatMoney(180000000, "INR", 0)).toBe("₹1,800,000");
  });
});
