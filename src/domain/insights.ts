import { countryByCode, LEVELS } from "./reference";
import { summarize, type Summary } from "./stats";
import { toUsdMinor } from "./money";

export const MIN_BAND_CELL = 12;

export type PayRow = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  department: string;
  level: string;
  status: string;
  jobTitle: string;
  annualAmountMinor: number;
  currency: string;
};

export type GroupStat = {
  key: string;
  label: string;
  headcount: number;
  usd: Summary;
  local: Summary | null;
  localCurrency: string | null;
};

export type Outlier = {
  id: number;
  employeeCode: string;
  name: string;
  countryCode: string;
  department: string;
  level: string;
  jobTitle: string;
  currency: string;
  annualAmountMinor: number;
  usdMinor: number;
  medianUsdMinor: number;
  p10UsdMinor: number;
  p90UsdMinor: number;
  side: "below" | "above";
};

export type Insights = {
  country: string | undefined;
  headcount: { active: number; onLeave: number; terminated: number };
  paidCount: number;
  payrollUsdMinor: number;
  medianUsdMinor: number;
  localCurrency: string | null;
  payrollLocalMinor: number | null;
  medianLocalMinor: number | null;
  byCountry: GroupStat[];
  byDepartment: GroupStat[];
  byLevel: GroupStat[];
  outliers: Outlier[];
};

type Point = PayRow & { usdMinor: number };

export function buildInsights(rows: PayRow[], rates: Record<string, number>, country?: string): Insights {
  const scoped = country ? rows.filter((row) => row.countryCode === country) : rows;
  const paid = scoped
    .filter((row) => row.status !== "terminated")
    .map((row) => ({ ...row, usdMinor: toUsdMinor(row.annualAmountMinor, rates[row.currency]) }));

  const currencies = new Set(paid.map((row) => row.currency));
  const localCurrency = currencies.size === 1 ? [...currencies][0] : null;
  const usdSummary = paid.length > 0 ? summarize(paid.map((row) => row.usdMinor)) : null;
  const localSummary =
    localCurrency && paid.length > 0 ? summarize(paid.map((row) => row.annualAmountMinor)) : null;

  return {
    country,
    headcount: {
      active: scoped.filter((row) => row.status === "active").length,
      onLeave: scoped.filter((row) => row.status === "on_leave").length,
      terminated: scoped.filter((row) => row.status === "terminated").length,
    },
    paidCount: paid.length,
    payrollUsdMinor: usdSummary?.total ?? 0,
    medianUsdMinor: usdSummary?.median ?? 0,
    localCurrency,
    payrollLocalMinor: localSummary?.total ?? null,
    medianLocalMinor: localSummary?.median ?? null,
    byCountry: country ? [] : groupBy(paid, (row) => row.countryCode, (key) => countryByCode(key)?.name ?? key),
    byDepartment: groupBy(paid, (row) => row.department, (key) => key),
    byLevel: groupBy(paid, (row) => row.level, (key) => key).sort(
      (a, b) => LEVELS.indexOf(a.key as (typeof LEVELS)[number]) - LEVELS.indexOf(b.key as (typeof LEVELS)[number]),
    ),
    outliers: findOutliers(paid.filter((row) => row.status === "active")),
  };
}

function groupBy(rows: Point[], keyOf: (row: Point) => string, labelOf: (key: string) => string): GroupStat[] {
  const groups = new Map<string, Point[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()]
    .map(([key, people]) => {
      const currencies = new Set(people.map((person) => person.currency));
      const localCurrency = currencies.size === 1 ? [...currencies][0] : null;
      return {
        key,
        label: labelOf(key),
        headcount: people.length,
        usd: summarize(people.map((person) => person.usdMinor)),
        local: localCurrency ? summarize(people.map((person) => person.annualAmountMinor)) : null,
        localCurrency,
      };
    })
    .sort((a, b) => b.usd.total - a.usd.total);
}

function findOutliers(active: Point[]): Outlier[] {
  const cells = new Map<string, Point[]>();
  for (const person of active) {
    const key = `${person.countryCode}:${person.level}`;
    const list = cells.get(key);
    if (list) list.push(person);
    else cells.set(key, [person]);
  }

  const outliers: Outlier[] = [];
  for (const people of cells.values()) {
    if (people.length < MIN_BAND_CELL) continue;
    const summary = summarize(people.map((person) => person.usdMinor));
    for (const person of people) {
      if (person.usdMinor >= summary.p10 && person.usdMinor <= summary.p90) continue;
      outliers.push({
        id: person.id,
        employeeCode: person.employeeCode,
        name: `${person.firstName} ${person.lastName}`,
        countryCode: person.countryCode,
        department: person.department,
        level: person.level,
        jobTitle: person.jobTitle,
        currency: person.currency,
        annualAmountMinor: person.annualAmountMinor,
        usdMinor: person.usdMinor,
        medianUsdMinor: summary.median,
        p10UsdMinor: summary.p10,
        p90UsdMinor: summary.p90,
        side: person.usdMinor < summary.p10 ? "below" : "above",
      });
    }
  }

  return outliers
    .sort((a, b) => Math.abs(b.usdMinor - b.medianUsdMinor) - Math.abs(a.usdMinor - a.medianUsdMinor) || a.employeeCode.localeCompare(b.employeeCode))
    .slice(0, 12);
}
