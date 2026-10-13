import Link from "next/link";
import type { ReactNode } from "react";
import { getDb } from "../../db/database";
import { formatMoney } from "../../domain/money";
import { COUNTRIES, DEPARTMENTS, LEVELS, STATUSES, STATUS_LABELS, countryByCode } from "../../domain/reference";
import { employeeQueryToSearch, parseEmployeeQuery, searchRecordToParams, type EmployeeQuery, type SortKey } from "../../domain/query";
import { listEmployees } from "../../server/employees";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseEmployeeQuery(searchRecordToParams(await searchParams));
  const page = listEmployees(getDb(), query);
  const start = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const end = Math.min(page.total, page.page * page.pageSize);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>People</h1>
          <p className="lede">
            Showing {start.toLocaleString("en-US")}–{end.toLocaleString("en-US")} of {page.total.toLocaleString("en-US")}.
          </p>
        </div>
      </header>

      <form className="filters" action="/employees" method="get">
        <label>
          Search
          <input name="q" defaultValue={query.q ?? ""} placeholder="Name, email, or ACME code" />
        </label>
        <label>
          Country
          <select name="country" defaultValue={query.country ?? ""}>
            <option value="">Any</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Department
          <select name="department" defaultValue={query.department ?? ""}>
            <option value="">Any</option>
            {DEPARTMENTS.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
        </label>
        <label>
          Level
          <select name="level" defaultValue={query.level ?? ""}>
            <option value="">Any</option>
            {LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={query.status ?? ""}>
            <option value="">Any</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filter</button>
        <Link className="button secondary" href="/employees">
          Clear
        </Link>
      </form>

      <section className="panel">
        {page.employees.length === 0 ? (
          <p className="empty">No one matches these filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><SortLink query={query} sort="name">Person</SortLink></th>
                  <th><SortLink query={query} sort="country">Country</SortLink></th>
                  <th><SortLink query={query} sort="department">Department</SortLink></th>
                  <th><SortLink query={query} sort="level">Level</SortLink></th>
                  <th>Status</th>
                  <th className="num"><SortLink query={query} sort="salary">Annual pay</SortLink></th>
                </tr>
              </thead>
              <tbody>
                {page.employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <Link className="name" href={`/employees/${employee.id}`}>
                        {employee.firstName} {employee.lastName}
                        <small>{employee.employeeCode} · {employee.jobTitle}</small>
                      </Link>
                    </td>
                    <td>{countryByCode(employee.countryCode)?.name}</td>
                    <td>{employee.department}</td>
                    <td>{employee.level}</td>
                    <td><span className={`status ${employee.status}`}>{STATUS_LABELS[employee.status as keyof typeof STATUS_LABELS]}</span></td>
                    <td className="num">
                      {formatMoney(employee.annualAmountMinor, employee.currency)}
                      <span className="sub">{formatMoney(employee.usdMinor, "USD")} USD</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="pager">
        <span>Page {page.page} of {page.pageCount}</span>
        <nav aria-label="Pagination">
          {page.page > 1 ? <Link href={href(query, page.page - 1)}>Previous</Link> : null}
          {page.page < page.pageCount ? <Link href={href(query, page.page + 1)}>Next</Link> : null}
        </nav>
      </div>
    </>
  );
}

function href(query: EmployeeQuery, page: number): string {
  return `/employees${employeeQueryToSearch(query, { page })}`;
}

function SortLink({ query, sort, children }: { query: EmployeeQuery; sort: SortKey; children: ReactNode }) {
  const direction = query.sort === sort ? (query.direction === "asc" ? "desc" : "asc") : sort === "salary" ? "desc" : "asc";
  const mark = query.sort === sort ? (query.direction === "asc" ? " ↑" : " ↓") : "";
  return <Link href={`/employees${employeeQueryToSearch(query, { sort, direction, page: 1 })}`}>{children}{mark}</Link>;
}
