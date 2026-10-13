import Link from "next/link";
import { Breakdown } from "../components/breakdown";
import { getDb } from "../db/database";
import { formatCompact, formatMoney } from "../domain/money";
import { parseCountry } from "../domain/query";
import { COUNTRIES, FX_AS_OF, FX_RATES, countryByCode } from "../domain/reference";
import { searchRecordToParams } from "../domain/query";
import { getInsights } from "../server/insights";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const country = parseCountry(searchRecordToParams(params).get("country") ?? undefined);
  const insights = getInsights(getDb(), country);
  const market = country ? countryByCode(country)?.name : "all markets";
  const local = insights.localCurrency;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Compensation overview</p>
          <h1>How ACME pays people</h1>
          <p className="lede">
            Active and on-leave salaries for {market}. Stored pay stays in local currency. Cross-market totals use the {FX_AS_OF} USD rate card.
          </p>
        </div>
        <form className="market" action="/" method="get">
          <label>
            Market
            <select name="country" defaultValue={country ?? ""}>
              <option value="">All countries</option>
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Apply</button>
        </form>
      </header>

      <section className="kpis">
        <article className="kpi">
          <span>Active payroll</span>
          <strong title={formatMoney(local ? insights.payrollLocalMinor ?? 0 : insights.payrollUsdMinor, local ?? "USD", 2)}>
            {formatCompact(local ? insights.payrollLocalMinor ?? 0 : insights.payrollUsdMinor, local ?? "USD")}
          </strong>
          <em>{local ? `${formatCompact(insights.payrollUsdMinor, "USD")} at the rate card` : "USD equivalent"}</em>
        </article>
        <article className="kpi">
          <span>Median annual pay</span>
          <strong>{formatMoney(local ? insights.medianLocalMinor ?? 0 : insights.medianUsdMinor, local ?? "USD")}</strong>
          <em>{local ? `${formatMoney(insights.medianUsdMinor, "USD")} USD` : "Across the people in view"}</em>
        </article>
        <article className="kpi">
          <span>People in payroll</span>
          <strong>{insights.paidCount.toLocaleString("en-US")}</strong>
          <em>
            {insights.headcount.active.toLocaleString("en-US")} active · {insights.headcount.onLeave.toLocaleString("en-US")} on leave
          </em>
        </article>
        <article className="kpi">
          <span>Terminated, excluded</span>
          <strong>{insights.headcount.terminated.toLocaleString("en-US")}</strong>
          <em>Still searchable in the directory</em>
        </article>
      </section>

      <Breakdown
        countries={insights.byCountry}
        departments={insights.byDepartment}
        levels={insights.byLevel}
        preferLocal={Boolean(local)}
      />

      <section className="panel">
        <h2>Outside the usual range</h2>
        <p className="hint">
          Active people below the 10th or above the 90th percentile for the same country and level. Groups smaller than 12 are not judged.
        </p>
        {insights.outliers.length === 0 ? (
          <p className="empty">No one in this view sits outside a large enough band.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Market</th>
                <th>Level</th>
                <th className="num">Pay</th>
                <th className="num">Band median</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {insights.outliers.map((person) => (
                <tr key={person.id}>
                  <td>
                    <Link className="name" href={`/employees/${person.id}`}>
                      {person.name}
                      <small>{person.jobTitle}</small>
                    </Link>
                  </td>
                  <td>{countryByCode(person.countryCode)?.name}</td>
                  <td>{person.level}</td>
                  <td className="num">{formatMoney(person.annualAmountMinor, person.currency)}</td>
                  <td className="num">{formatMoney(person.medianUsdMinor, "USD")}</td>
                  <td>{person.side === "below" ? "Below band" : "Above band"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <details className="rates">
        <summary>Rate card used for USD comparison</summary>
        <ul>
          {Object.entries(FX_RATES).map(([code, rate]) => (
            <li key={code}>
              1 {code} = {rate} USD
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
