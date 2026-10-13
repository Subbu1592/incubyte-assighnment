import Link from "next/link";
import { notFound } from "next/navigation";
import { SalaryForm } from "../../../components/salary-form";
import { getDb } from "../../../db/database";
import { todayIso } from "../../../domain/dates";
import { formatMoney } from "../../../domain/money";
import { EMPLOYMENT_LABELS, REASON_LABELS, STATUS_LABELS, countryByCode, type Status } from "../../../domain/reference";
import { getEmployee } from "../../../server/employees";

export const dynamic = "force-dynamic";

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) notFound();
  const employee = getEmployee(getDb(), numeric);
  if (!employee) notFound();
  const today = todayIso();

  return (
    <>
      <p className="crumb"><Link href="/employees">← People</Link></p>
      <div className="profile">
        <section className="panel padded identity">
          <h2>{employee.firstName} {employee.lastName}</h2>
          <div className="meta">
            <span className={`status ${employee.status}`}>{STATUS_LABELS[employee.status as Status]}</span>
            <span>{employee.employeeCode}</span>
          </div>
          <dl>
            <dt>Role</dt>
            <dd>{employee.jobTitle}</dd>
            <dt>Department</dt>
            <dd>{employee.department} · {employee.level}</dd>
            <dt>Location</dt>
            <dd>{employee.city}, {countryByCode(employee.countryCode)?.name}</dd>
            <dt>Employment</dt>
            <dd>{EMPLOYMENT_LABELS[employee.employmentType] ?? employee.employmentType}</dd>
            <dt>Hired</dt>
            <dd>{employee.hireDate}</dd>
            <dt>Email</dt>
            <dd>{employee.email}</dd>
          </dl>
          {employee.current ? (
            <div className="pay-now">
              <span className="sub">Current annual salary</span>
              <strong>{formatMoney(employee.current.annualAmountMinor, employee.current.currency, 2)}</strong>
              <span className="sub">
                {formatMoney(employee.usdMinor ?? 0, "USD")} USD · since {employee.current.effectiveFrom}
              </span>
            </div>
          ) : null}
        </section>

        {employee.status === "terminated" ? (
          <section className="panel padded form">
            <h2>No new salary</h2>
            <p className="hint">Terminated employees stay on record. A new salary starts only after they are active again.</p>
          </section>
        ) : (
          <SalaryForm employeeId={employee.id} currency={employee.current?.currency ?? "USD"} today={today} level={employee.level} />
        )}
      </div>

      <section className="panel">
        <h2>Salary history</h2>
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th className="num">Annual amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {employee.history.map((record) => (
              <tr key={record.id}>
                <td>{record.effectiveFrom}</td>
                <td>{record.effectiveTo ?? "Current"}</td>
                <td>{REASON_LABELS[record.changeReason] ?? record.changeReason}</td>
                <td className="num">{formatMoney(record.annualAmountMinor, record.currency, 2)}</td>
                <td>{record.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
