import { describe, expect, it } from "vitest";
import { previousDay } from "./dates";
import { countryByCode } from "./reference";
import { generateWorkforce } from "./workforce";

describe("generateWorkforce", () => {
  it("is deterministic and codes the first employee", () => {
    const first = generateWorkforce(5);
    const second = generateWorkforce(5);
    expect(second.employees[0]).toEqual(first.employees[0]);
    expect(first.employees[0].employeeCode).toBe("ACME-00001");
  });

  it("gives every person one open salary in their country's currency", () => {
    const { employees, salaries } = generateWorkforce(300);
    const open = new Map<number, number>();
    for (const salary of salaries) {
      expect(salary.annualAmountMinor).toBeGreaterThan(0);
      if (salary.effectiveTo === null) open.set(salary.employeeIndex, (open.get(salary.employeeIndex) ?? 0) + 1);
      if (salary.effectiveTo) expect(salary.effectiveTo >= salary.effectiveFrom).toBe(true);
    }
    expect(open.size).toBe(employees.length);
    expect([...open.values()].every((count) => count === 1)).toBe(true);

    for (const employee of employees) {
      const country = countryByCode(employee.countryCode);
      const rows = salaries.filter((salary) => salary.employeeIndex === employees.indexOf(employee));
      expect(rows.every((row) => row.currency === country?.currency)).toBe(true);
    }
  });

  it("chains history so each closed record ends the day before the next", () => {
    const { employees, salaries } = generateWorkforce(80);
    for (let index = 0; index < employees.length; index += 1) {
      const rows = salaries
        .filter((salary) => salary.employeeIndex === index)
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
      rows.forEach((row, rowIndex) => {
        const next = rows[rowIndex + 1];
        if (!next) expect(row.effectiveTo).toBeNull();
        else expect(row.effectiveTo).toBe(previousDay(next.effectiveFrom));
      });
    }
  });

  it("builds the full 10,000 person population with unique identities", () => {
    const { employees, salaries } = generateWorkforce(10000);
    expect(employees).toHaveLength(10000);
    expect(new Set(employees.map((employee) => employee.email)).size).toBe(10000);
    expect(new Set(employees.map((employee) => employee.employeeCode)).size).toBe(10000);
    expect(new Set(employees.map((employee) => `${employee.firstName} ${employee.lastName}`)).size).toBe(10000);
    const open = salaries.filter((salary) => salary.effectiveTo === null);
    expect(open).toHaveLength(10000);
  });
});
