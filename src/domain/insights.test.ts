import { describe, expect, it } from "vitest";
import { buildInsights, type PayRow } from "./insights";

const rates = { USD: 1, INR: 0.012 };

function person(partial: Partial<PayRow> & Pick<PayRow, "id" | "annualAmountMinor">): PayRow {
  return {
    employeeCode: `ACME-${partial.id}`,
    firstName: "Ada",
    lastName: "Lovelace",
    countryCode: "US",
    department: "Engineering",
    level: "IC3",
    status: "active",
    jobTitle: "Software Engineer II",
    currency: "USD",
    ...partial,
  };
}

describe("buildInsights", () => {
  it("keeps terminated people out of payroll and answers in one currency when filtered", () => {
    const rows = [
      person({ id: 1, annualAmountMinor: 100_00 }),
      person({ id: 2, annualAmountMinor: 300_00 }),
      person({ id: 3, status: "terminated", annualAmountMinor: 900_00 }),
      person({ id: 4, countryCode: "IN", currency: "INR", annualAmountMinor: 1_000_000_00, department: "Sales" }),
    ];

    const all = buildInsights(rows, rates);
    expect(all.headcount).toEqual({ active: 3, onLeave: 0, terminated: 1 });
    expect(all.paidCount).toBe(3);
    expect(all.byCountry.map((group) => group.key).sort()).toEqual(["IN", "US"]);
    expect(all.localCurrency).toBeNull();

    const india = buildInsights(rows, rates, "IN");
    expect(india.paidCount).toBe(1);
    expect(india.localCurrency).toBe("INR");
    expect(india.payrollLocalMinor).toBe(1_000_000_00);
    expect(india.byCountry).toEqual([]);
  });

  it("flags people outside their own country and level, not a global rank", () => {
    const rows: PayRow[] = [];
    for (let id = 1; id <= 20; id += 1) {
      rows.push(person({ id, annualAmountMinor: 100_00, lastName: `Person${id}` }));
    }
    rows.push(person({ id: 21, annualAmountMinor: 1_00, lastName: "Low" }));
    rows.push(person({ id: 22, countryCode: "IN", currency: "INR", annualAmountMinor: 100_00, level: "IC1" }));

    const insights = buildInsights(rows, rates);
    expect(insights.outliers.some((row) => row.id === 21 && row.side === "below")).toBe(true);
    expect(insights.outliers.some((row) => row.id === 22)).toBe(false);
  });
});
