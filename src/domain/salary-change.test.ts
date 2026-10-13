import { describe, expect, it } from "vitest";
import { currencies } from "./reference";
import { parseSalaryRequest, planSalaryChange, type OpenSalary } from "./salary-change";

const current: OpenSalary = {
  id: 7,
  annualAmountMinor: 10_000_00,
  currency: "USD",
  effectiveFrom: "2024-01-01",
};

const known = currencies();

describe("planSalaryChange", () => {
  it("closes the current record the day before the new one", () => {
    const result = planSalaryChange({
      employeeStatus: "active",
      current,
      today: "2026-10-13",
      knownCurrencies: known,
      next: {
        annualAmountMinor: 11_000_00,
        currency: "USD",
        effectiveFrom: "2026-10-13",
        changeReason: "merit",
        notes: null,
        level: null,
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.close).toEqual({ id: 7, effectiveTo: "2026-10-12" });
    expect(result.plan.insert.annualAmountMinor).toBe(11_000_00);
  });

  it("allows a correction that lowers pay", () => {
    const result = planSalaryChange({
      employeeStatus: "on_leave",
      current,
      today: "2026-10-13",
      knownCurrencies: known,
      next: {
        annualAmountMinor: 9_000_00,
        currency: "EUR",
        effectiveFrom: "2026-04-01",
        changeReason: "correction",
        notes: "Wrong currency on hire",
        level: "IC4",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("refuses terminated people, overlapping dates, and far-future dates", () => {
    expect(
      planSalaryChange({
        employeeStatus: "terminated",
        current,
        today: "2026-10-13",
        knownCurrencies: known,
        next: { ...blankNext(), effectiveFrom: "2026-10-13" },
      }).ok,
    ).toBe(false);

    const overlap = planSalaryChange({
      employeeStatus: "active",
      current,
      today: "2026-10-13",
      knownCurrencies: known,
      next: { ...blankNext(), effectiveFrom: "2024-01-01" },
    });
    expect(overlap.ok).toBe(false);

    const distant = planSalaryChange({
      employeeStatus: "active",
      current,
      today: "2026-10-13",
      knownCurrencies: known,
      next: { ...blankNext(), effectiveFrom: "2028-10-13" },
    });
    expect(distant.ok).toBe(false);
  });
});

describe("parseSalaryRequest", () => {
  it("normalizes a form body", () => {
    const parsed = parseSalaryRequest({
      amount: "150000.25",
      currency: "usd",
      effectiveFrom: "2026-10-13",
      changeReason: "promotion",
      notes: "  ",
      level: "IC5",
    });
    expect(parsed).toEqual({
      ok: true,
      value: {
        annualAmountMinor: 15000025,
        currency: "USD",
        effectiveFrom: "2026-10-13",
        changeReason: "promotion",
        notes: null,
        level: "IC5",
      },
    });
  });

  it("rejects an unknown reason", () => {
    const parsed = parseSalaryRequest({ amount: "10", currency: "USD", effectiveFrom: "2026-10-13", changeReason: "because" });
    expect(parsed.ok).toBe(false);
  });
});

function blankNext() {
  return {
    annualAmountMinor: 10_000_00,
    currency: "USD",
    effectiveFrom: "2026-10-13",
    changeReason: "merit" as const,
    notes: null,
    level: null,
  };
}
