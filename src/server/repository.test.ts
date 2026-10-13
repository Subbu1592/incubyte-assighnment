import { describe, expect, it } from "vitest";
import { openDatabase, seedDatabase } from "../db/database";
import { parseEmployeeQuery } from "../domain/query";
import { changeSalary, getEmployee, listEmployees } from "./employees";
import { employeeCount, getInsights } from "./insights";

describe("salary repository", () => {
  it("seeds a paged directory and refuses a second seed", () => {
    const db = openDatabase(":memory:");
    expect(seedDatabase(db, 40)).toBe(40);
    expect(seedDatabase(db, 40)).toBe(40);
    expect(employeeCount(db)).toBe(40);

    const page = listEmployees(db, parseEmployeeQuery(new URLSearchParams("pageSize=10&sort=salary")));
    expect(page.employees).toHaveLength(10);
    expect(page.total).toBe(40);
    expect(page.employees[0].usdMinor).toBeGreaterThanOrEqual(page.employees[1].usdMinor);

    const india = listEmployees(db, parseEmployeeQuery(new URLSearchParams("country=IN&pageSize=100")));
    expect(india.employees.every((employee) => employee.countryCode === "IN")).toBe(true);
    expect(getInsights(db, "IN").localCurrency).toBe(india.total > 0 ? "INR" : null);
  });

  it("closes the previous salary and can update level", () => {
    const db = openDatabase(":memory:");
    seedDatabase(db, 40);
    const active = db.prepare("SELECT id FROM employees WHERE status = 'active' ORDER BY id LIMIT 1").get() as { id: number };
    const before = getEmployee(db, active.id);
    expect(before?.current).toBeTruthy();
    if (!before?.current) return;

    const nextMinor = before.current.annualAmountMinor + 250000;
    const result = changeSalary(
      db,
      active.id,
      {
        amount: minorToMajor(nextMinor),
        currency: before.current.currency,
        effectiveFrom: "2026-10-13",
        changeReason: "promotion",
        notes: "Annual review",
        level: "IC5",
      },
      "2026-10-13",
    );
    expect(result).toEqual({ ok: true });

    const after = getEmployee(db, active.id);
    expect(after?.level).toBe("IC5");
    expect(after?.current?.annualAmountMinor).toBe(nextMinor);
    expect(after?.current?.effectiveFrom).toBe("2026-10-13");
    expect(after?.history).toHaveLength(before.history.length + 1);
    const closed = after?.history.find((record) => record.id === before.current?.id);
    expect(closed?.effectiveTo).toBe("2026-10-12");
    expect(db.prepare("SELECT COUNT(*) AS c FROM salary_records WHERE employee_id = ? AND effective_to IS NULL").get(active.id)).toEqual({ c: 1 });
  });

  it("rejects a salary change for a terminated employee", () => {
    const db = openDatabase(":memory:");
    seedDatabase(db, 80);
    const terminated = db.prepare("SELECT id FROM employees WHERE status = 'terminated' LIMIT 1").get() as { id: number } | undefined;
    expect(terminated).toBeTruthy();
    if (!terminated) return;
    const profile = getEmployee(db, terminated.id);
    const result = changeSalary(
      db,
      terminated.id,
      {
        amount: "100000",
        currency: profile?.current?.currency ?? "USD",
        effectiveFrom: "2026-10-13",
        changeReason: "merit",
      },
      "2026-10-13",
    );
    expect(result.ok).toBe(false);
  });

  it("loads the full 10,000 person database", () => {
    const db = openDatabase(":memory:");
    expect(seedDatabase(db, 10000)).toBe(10000);
    const page = listEmployees(db, parseEmployeeQuery(new URLSearchParams("q=ACME-10000")));
    expect(page.total).toBe(1);
    expect(page.employees[0].employeeCode).toBe("ACME-10000");
    expect(getInsights(db).paidCount).toBeGreaterThan(8000);
  });
});

function minorToMajor(minor: number): string {
  const whole = Math.floor(minor / 100);
  const fraction = String(minor % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}
