import type { PaybookDb } from "../db/database";
import { buildInsights, type Insights, type PayRow } from "../domain/insights";
import { FX_RATES } from "../domain/reference";

export function getInsights(db: PaybookDb, country?: string): Insights {
  const rows = db.prepare(`
    SELECT
      e.id,
      e.employee_code AS employeeCode,
      e.first_name AS firstName,
      e.last_name AS lastName,
      e.country_code AS countryCode,
      e.department,
      e.level,
      e.status,
      e.job_title AS jobTitle,
      s.annual_amount_minor AS annualAmountMinor,
      s.currency
    FROM employees e
    JOIN salary_records s ON s.employee_id = e.id AND s.effective_to IS NULL
    WHERE (? IS NULL OR e.country_code = ?)
  `).all(country ?? null, country ?? null) as PayRow[];

  return buildInsights(rows, FX_RATES, country);
}

export function employeeCount(db: PaybookDb): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM employees").get() as { c: number }).c;
}
