import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { generateWorkforce } from "../domain/workforce";
import { FX_AS_OF, FX_RATES } from "../domain/reference";

export type PaybookDb = DatabaseSync;

export function withTransaction(db: PaybookDb, work: () => void): void {
  db.exec("BEGIN");
  try {
    work();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  level TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  status TEXT NOT NULL,
  hire_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS salary_records (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  annual_amount_minor INTEGER NOT NULL CHECK (annual_amount_minor > 0),
  currency TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  change_reason TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE TABLE IF NOT EXISTS fx_rates (
  currency TEXT PRIMARY KEY,
  usd_per_unit REAL NOT NULL CHECK (usd_per_unit > 0),
  as_of TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS salary_one_open
  ON salary_records(employee_id) WHERE effective_to IS NULL;

CREATE INDEX IF NOT EXISTS employees_directory
  ON employees(status, country_code, department, level);

CREATE INDEX IF NOT EXISTS salary_employee
  ON salary_records(employee_id, effective_from);
`;

export function migrate(db: PaybookDb): void {
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
}

export function openDatabase(filename: string): PaybookDb {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA busy_timeout = 5000");
  if (filename !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  migrate(db);
  return db;
}

export function seedDatabase(db: PaybookDb, count = 10000): number {
  const existing = db.prepare("SELECT COUNT(*) AS c FROM employees").get() as { c: number };
  if (existing.c > 0) return existing.c;

  const { employees, salaries } = generateWorkforce(count);
  const insertFx = db.prepare("INSERT INTO fx_rates (currency, usd_per_unit, as_of) VALUES (?, ?, ?)");
  const insertEmployee = db.prepare(`
    INSERT INTO employees (
      employee_code, first_name, last_name, email, country_code, city,
      department, job_title, level, employment_type, status, hire_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSalary = db.prepare(`
    INSERT INTO salary_records (
      employee_id, annual_amount_minor, currency, effective_from, effective_to, change_reason, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const write = () => {
    for (const [currency, usdPerUnit] of Object.entries(FX_RATES)) {
      insertFx.run(currency, usdPerUnit, FX_AS_OF);
    }
    const ids: number[] = [];
    for (const employee of employees) {
      const info = insertEmployee.run(
        employee.employeeCode,
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.countryCode,
        employee.city,
        employee.department,
        employee.jobTitle,
        employee.level,
        employee.employmentType,
        employee.status,
        employee.hireDate,
      );
      ids.push(Number(info.lastInsertRowid));
    }
    for (const salary of salaries) {
      insertSalary.run(
        ids[salary.employeeIndex],
        salary.annualAmountMinor,
        salary.currency,
        salary.effectiveFrom,
        salary.effectiveTo,
        salary.changeReason,
        salary.notes,
        salary.createdAt,
      );
    }
  };

  withTransaction(db, write);
  return count;
}

export function resetDatabase(db: PaybookDb, count = 10000): number {
  db.exec("DELETE FROM salary_records; DELETE FROM employees; DELETE FROM fx_rates;");
  return seedDatabase(db, count);
}

export function databasePath(): string {
  return path.join(process.cwd(), "data", "acme.sqlite");
}

const globalForDb = globalThis as unknown as { paybook?: PaybookDb };

export function getDb(): PaybookDb {
  if (!globalForDb.paybook) {
    const db = openDatabase(databasePath());
    const existing = db.prepare("SELECT COUNT(*) AS c FROM employees").get() as { c: number };
    if (existing.c === 0) {
      const started = Date.now();
      const count = seedDatabase(db, Number(process.env.SEED_COUNT ?? 10000));
      console.log(`Paybook seeded ${count} employees in ${Date.now() - started}ms`);
    }
    globalForDb.paybook = db;
  }
  return globalForDb.paybook;
}
