"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { formatCompact, formatMoney } from "../domain/money";
import type { GroupStat } from "../domain/insights";

export function Breakdown({
  countries,
  departments,
  levels,
  preferLocal,
}: {
  countries: GroupStat[];
  departments: GroupStat[];
  levels: GroupStat[];
  preferLocal: boolean;
}) {
  const first = countries.length > 0 ? "country" : "department";
  return (
    <section className="panel">
      <h2>Where the money goes</h2>
      <p className="hint">Payroll share among active and on-leave employees. The bar is relative to the largest group in the tab.</p>
      <Tabs.Root defaultValue={first}>
        <Tabs.List className="tabs" aria-label="Pay breakdown">
          {countries.length > 0 ? <Tabs.Trigger value="country">Country</Tabs.Trigger> : null}
          <Tabs.Trigger value="department">Department</Tabs.Trigger>
          <Tabs.Trigger value="level">Level</Tabs.Trigger>
        </Tabs.List>
        {countries.length > 0 ? (
          <Tabs.Content value="country">
            <GroupTable rows={countries} preferLocal={preferLocal} />
          </Tabs.Content>
        ) : null}
        <Tabs.Content value="department">
          <GroupTable rows={departments} preferLocal={preferLocal} />
        </Tabs.Content>
        <Tabs.Content value="level">
          <GroupTable rows={levels} preferLocal={preferLocal} />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}

function GroupTable({ rows, preferLocal }: { rows: GroupStat[]; preferLocal: boolean }) {
  if (rows.length === 0) return <p className="empty">No paid employees in this view.</p>;
  const totals = rows.map((row) => displayed(row, preferLocal).total);
  const max = Math.max(...totals, 1);
  return (
    <table>
      <thead>
        <tr>
          <th>Group</th>
          <th className="num">People</th>
          <th className="num">Median</th>
          <th className="num">Payroll</th>
          <th>Share</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const money = displayed(row, preferLocal);
          return (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td className="num">{row.headcount.toLocaleString("en-US")}</td>
              <td className="num">{formatMoney(money.median, money.currency)}</td>
              <td className="num" title={formatMoney(money.total, money.currency, 2)}>
                {formatCompact(money.total, money.currency)}
              </td>
              <td className="bar-cell">
                <div className="bar" aria-hidden>
                  <span style={{ width: `${(money.total / max) * 100}%` }} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function displayed(row: GroupStat, preferLocal: boolean): { total: number; median: number; currency: string } {
  if (preferLocal && row.local && row.localCurrency) {
    return { total: row.local.total, median: row.local.median, currency: row.localCurrency };
  }
  return { total: row.usd.total, median: row.usd.median, currency: "USD" };
}
