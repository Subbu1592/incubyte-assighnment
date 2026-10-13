# Trade-offs

## SQLite in the app process

10,000 employees and a short salary history fit comfortably in one file. SQLite gives transactions, a partial unique index, and no extra service to run. The cost is deployment: the file must live on a persistent disk.

Vercel-style serverless is a poor fit. The filesystem is ephemeral, and native `better-sqlite3` does not match that model. The supported shape is `next start` or the included Dockerfile, with `data/` on a volume. If ACME later needed several app instances, I would move this schema to Postgres rather than invent a shared-SQLite layer.

## Integers for money, a fixed rate card for comparison

Local currency is the record. USD is a view. Rates are the 1 Oct 2026 card stored in `fx_rates`, not a live feed. HR can explain a number six months later. The cost is that the card drifts from the market. Replacing it is an update to one table, not a change to salary rows.

Cross-country outlier detection uses country and level together. A global USD percentile would mostly flag India versus the United States, which is a market difference, not a person paid oddly inside their market.

## Aggregates in process

Percentiles are awkward in SQL and easy to test in TypeScript. Loading 10,000 open salaries is a small query. I would push the aggregation into SQL, or precompute it, once the population or the number of concurrent HR users made this request slower than a couple of hundred milliseconds. The directory is already SQL-side: filters, sort, limit.

## Current role only

Salary history does not store the level at the time. That keeps the first version small. The cost is that a promotion recorded last year does not show the old title. The event and the amount are still there.

## No login

The assessment is about the salary record and the questions HR asks. A login screen would not teach us whether those are right. The app should sit behind the company’s SSO before it holds real pay data. I would add that at the edge, not inside the salary rules.

## Hand-built UI, Radix for interaction

Layout, tables, and forms are local components. `@radix-ui/react-tabs` and `@radix-ui/react-label` cover the accessible tab pattern and form labels. A full kit such as MUI would have been faster to assemble and harder to make feel like a finance tool.

## Seeded history instead of a blank system

Reviewers need to see 10,000 people immediately. The generator is deterministic (seed `20261013`) so tests and demos match. It is synthetic. It is not ACME’s real pay policy.

## What I would do next

- SSO in front of the app, then an audit row for who changed a salary.
- A level on each salary record so bands can be read as of a date.
- Postgres when more than one application instance needs to write.
