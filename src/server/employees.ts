import { withTransaction, type PaybookDb } from "../db/database";
import { currencies, FX_RATES } from "../domain/reference";
import { likeContains, type EmployeeQuery } from "../domain/query";
import { parseSalaryRequest, planSalaryChange } from "../domain/salary-change";
import { jobTitle } from "../domain/titles";
import { toUsdMinor } from "../domain/money";

export type DirectoryEmployee = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  city: string;
  department: string;
  jobTitle: string;
  level: string;
  employmentType: string;
  status: string;
  hireDate: string;
  annualAmountMinor: number;
  currency: string;
  usdMinor: number;
  effectiveFrom: string;
};

export type DirectoryPage = {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  employees: DirectoryEmployee[];
};

export type SalaryRecordView = {
  id: number;
  annualAmountMinor: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: string;
  notes: string | null;
  createdAt: string;
};

export type EmployeeProfile = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  city: string;
  department: string;
  jobTitle: string;
  level: string;
  employmentType: string;
  status: string;
  hireDate: string;
  current: SalaryRecordView | null;
  usdMinor: number | null;
  history: SalaryRecordView[];
};

type ChangeResult = { ok: true } | { ok: false; status: 400 | 404; error: string };

const ORDER: Record<EmployeeQuery["sort"], string> = {
  name: "e.last_name, e.first_name",
  country: "e.country_code, e.last_name",
  department: "e.department, e.last_name",
  level: "e.level, e.last_name",
  hire_date: "e.hire_date",
  salary: "usd_minor",
};

export function listEmployees(db: PaybookDb, query: EmployeeQuery): DirectoryPage {
  const { where, params } = filters(query);
  const total = (db.prepare(`
    SELECT COUNT(*) AS c
    FROM employees e
    JOIN salary_records s ON s.employee_id = e.id AND s.effective_to IS NULL
    ${where}
  `).get(...params) as { c: number }).c;

  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const rows = db.prepare(`
    SELECT
      e.id, e.employee_code, e.first_name, e.last_name, e.email, e.country_code, e.city,
      e.department, e.job_title, e.level, e.employment_type, e.status, e.hire_date,
      s.annual_amount_minor, s.currency, s.effective_from,
      CAST(ROUND(s.annual_amount_minor * fx.usd_per_unit) AS INTEGER) AS usd_minor
    FROM employees e
    JOIN salary_records s ON s.employee_id = e.id AND s.effective_to IS NULL
    JOIN fx_rates fx ON fx.currency = s.currency
    ${where}
    ORDER BY ${ORDER[query.sort]} ${query.direction}, e.id ASC
    LIMIT ? OFFSET ?
  `).all(...params, query.pageSize, (page - 1) * query.pageSize) as DirectoryRow[];

  return {
    total,
    page,
    pageSize: query.pageSize,
    pageCount,
    employees: rows.map(mapDirectory),
  };
}

export function getEmployee(db: PaybookDb, id: number): EmployeeProfile | null {
  const employee = db.prepare(`
    SELECT id, employee_code, first_name, last_name, email, country_code, city,
           department, job_title, level, employment_type, status, hire_date
    FROM employees WHERE id = ?
  `).get(id) as EmployeeRow | undefined;
  if (!employee) return null;

  const history = (db.prepare(`
    SELECT id, annual_amount_minor, currency, effective_from, effective_to, change_reason, notes, created_at
    FROM salary_records
    WHERE employee_id = ?
    ORDER BY effective_from DESC, id DESC
  `).all(id) as SalaryRow[]).map(mapSalary);

  const current = history.find((record) => record.effectiveTo === null) ?? null;
  return {
    id: employee.id,
    employeeCode: employee.employee_code,
    firstName: employee.first_name,
    lastName: employee.last_name,
    email: employee.email,
    countryCode: employee.country_code,
    city: employee.city,
    department: employee.department,
    jobTitle: employee.job_title,
    level: employee.level,
    employmentType: employee.employment_type,
    status: employee.status,
    hireDate: employee.hire_date,
    current,
    usdMinor: current ? toUsdMinor(current.annualAmountMinor, FX_RATES[current.currency]) : null,
    history,
  };
}

export function changeSalary(db: PaybookDb, employeeId: number, body: unknown, today: string): ChangeResult {
  const parsed = parseSalaryRequest(body);
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error };

  const employee = db.prepare("SELECT id, status, department, level FROM employees WHERE id = ?").get(employeeId) as
    | { id: number; status: string; department: string; level: string }
    | undefined;
  if (!employee) return { ok: false, status: 404, error: "Employee not found." };

  const current = db.prepare(`
    SELECT id, annual_amount_minor AS annualAmountMinor, currency, effective_from AS effectiveFrom
    FROM salary_records
    WHERE employee_id = ? AND effective_to IS NULL
  `).get(employeeId) as { id: number; annualAmountMinor: number; currency: string; effectiveFrom: string } | undefined;
  if (!current) return { ok: false, status: 400, error: "This employee has no current salary." };

  const planned = planSalaryChange({
    employeeStatus: employee.status,
    current,
    next: parsed.value,
    today,
    knownCurrencies: currencies(),
  });
  if (!planned.ok) return { ok: false, status: 400, error: planned.error };

  const close = db.prepare("UPDATE salary_records SET effective_to = ? WHERE id = ? AND effective_to IS NULL");
  const insert = db.prepare(`
    INSERT INTO salary_records (
      employee_id, annual_amount_minor, currency, effective_from, effective_to, change_reason, notes, created_at
    ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)
  `);
  const updateLevel = db.prepare("UPDATE employees SET level = ?, job_title = ? WHERE id = ?");

  try {
    withTransaction(db, () => {
      const closed = close.run(planned.plan.close.effectiveTo, planned.plan.close.id);
      if (closed.changes !== 1) throw new Error("The open salary was no longer open.");
      insert.run(
        employeeId,
        planned.plan.insert.annualAmountMinor,
        planned.plan.insert.currency,
        planned.plan.insert.effectiveFrom,
        planned.plan.insert.changeReason,
        planned.plan.insert.notes,
        new Date().toISOString(),
      );
      if (planned.plan.level && planned.plan.level !== employee.level) {
        updateLevel.run(planned.plan.level, jobTitle(employee.department, planned.plan.level), employeeId);
      }
    });
  } catch (error) {
    console.error(error);
    return { ok: false, status: 400, error: "The current salary changed. Refresh and try again." };
  }

  return { ok: true };
}

function filters(query: EmployeeQuery): { where: string; params: Array<string | number> } {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (query.q) {
    const pattern = likeContains(query.q);
    clauses.push(`(
      e.employee_code LIKE ? ESCAPE '\\' OR
      e.email LIKE ? ESCAPE '\\' OR
      e.first_name LIKE ? ESCAPE '\\' OR
      e.last_name LIKE ? ESCAPE '\\' OR
      (e.first_name || ' ' || e.last_name) LIKE ? ESCAPE '\\'
    )`);
    params.push(pattern, pattern, pattern, pattern, pattern);
  }
  if (query.country) {
    clauses.push("e.country_code = ?");
    params.push(query.country);
  }
  if (query.department) {
    clauses.push("e.department = ?");
    params.push(query.department);
  }
  if (query.level) {
    clauses.push("e.level = ?");
    params.push(query.level);
  }
  if (query.status) {
    clauses.push("e.status = ?");
    params.push(query.status);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

type DirectoryRow = {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  city: string;
  department: string;
  job_title: string;
  level: string;
  employment_type: string;
  status: string;
  hire_date: string;
  annual_amount_minor: number;
  currency: string;
  effective_from: string;
  usd_minor: number;
};

type EmployeeRow = {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  city: string;
  department: string;
  job_title: string;
  level: string;
  employment_type: string;
  status: string;
  hire_date: string;
};

type SalaryRow = {
  id: number;
  annual_amount_minor: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  change_reason: string;
  notes: string | null;
  created_at: string;
};

function mapDirectory(row: DirectoryRow): DirectoryEmployee {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    countryCode: row.country_code,
    city: row.city,
    department: row.department,
    jobTitle: row.job_title,
    level: row.level,
    employmentType: row.employment_type,
    status: row.status,
    hireDate: row.hire_date,
    annualAmountMinor: row.annual_amount_minor,
    currency: row.currency,
    usdMinor: row.usd_minor,
    effectiveFrom: row.effective_from,
  };
}

function mapSalary(row: SalaryRow): SalaryRecordView {
  return {
    id: row.id,
    annualAmountMinor: row.annual_amount_minor,
    currency: row.currency,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    changeReason: row.change_reason,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
