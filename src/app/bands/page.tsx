import { getDb } from "../../db/database";
import { formatMoney } from "../../domain/money";
import { parseCountry } from "../../domain/query";
import { COUNTRIES, countryByCode } from "../../domain/reference";
import { searchRecordToParams } from "../../domain/query";
import type { Summary } from "../../domain/stats";
import { getInsights } from "../../server/insights";

export const dynamic = "force-dynamic";

export default async function BandsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const country = parseCountry(searchRecordToParams(await searchParams).get("country") ?? undefined);
  const insights = getInsights(getDb(), country);
  const local = insights.localCurrency;
  const market = country ? countryByCode(country)?.name : "all markets, in USD";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Bands</p>
          <h1>Pay by level</h1>
          <p className="lede">
            Percentiles for {market}. The bar runs from the 10th to the 90th percentile. The tick is the median.
          </p>
        </div>
        <form className="market" action="/bands" method="get">
          <label>
            Market
            <select name="country" defaultValue={country ?? ""}>
              <option value="">All countries (USD)</option>
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

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th className="num">People</th>
              <th className="num">p10</th>
              <th className="num">Median</th>
              <th className="num">p90</th>
              <th>Range</th>
            </tr>
          </thead>
          <tbody>
            {insights.byLevel.map((row) => {
              const summary = local && row.local ? row.local : row.usd;
              const currency = local && row.localCurrency ? row.localCurrency : "USD";
              return (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className="num">{row.headcount.toLocaleString("en-US")}</td>
                  <td className="num">{formatMoney(summary.p10, currency)}</td>
                  <td className="num">{formatMoney(summary.median, currency)}</td>
                  <td className="num">{formatMoney(summary.p90, currency)}</td>
                  <td><Band summary={summary} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Band({ summary }: { summary: Summary }) {
  const span = Math.max(1, summary.max - summary.min);
  const left = ((summary.p10 - summary.min) / span) * 100;
  const width = Math.max(1.5, ((summary.p90 - summary.p10) / span) * 100);
  const mid = ((summary.median - summary.min) / span) * 100;
  return (
    <div className="band" aria-hidden>
      <span className="band-fill" style={{ left: `${left}%`, width: `${width}%` }} />
      <span className="band-tick" style={{ left: `${mid}%` }} />
    </div>
  );
}
