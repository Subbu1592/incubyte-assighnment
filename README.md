# ACME Paybook

Salary records for 10,000 employees, and a way for an HR manager to see how ACME pays people. Local currency is the system of record. USD is a fixed rate card for comparison.

## Run

Requires Node.js 22.13 or newer (`node:sqlite`).

```bash
npm install
npm test
npm run dev
```

Open http://localhost:3000. The first start creates `data/acme.sqlite` and seeds 10,000 employees. That takes a few seconds.

```bash
npm run seed -- --reset   # rebuild the synthetic population
npm run build && npm start
```

## What is in here

| Path | What it is |
| --- | --- |
| `docs/REQUIREMENTS.md` | Goal, scope, and what was left out |
| `docs/ARCHITECTURE.md` | Layers and the salary-change flow |
| `docs/TRADEOFFS.md` | SQLite, FX, aggregates, auth |
| `docs/AI-WORKFLOW.md` | How the agent was used |
| `docs/DEMO.md` | Two-minute recording script |
| `src/domain` | Money, history rules, insights, seed generator |
| `src/db` | Schema and seed |
| `src/server` | Directory, profile, pay change |
| `src/app` | Pages and JSON API |

## API

```bash
curl -s localhost:3000/api/health
curl -s "localhost:3000/api/employees?country=IN&pageSize=2"
curl -s "localhost:3000/api/insights?country=DE"
```

A pay change is `POST /api/employees/:id/salary` with `amount`, `currency`, `effectiveFrom`, `changeReason`, optional `notes` and `level`.

## Deploy

Run it as a Node server with the SQLite file on a persistent disk. `Dockerfile` is that unit. Serverless disk will lose the database. See `docs/TRADEOFFS.md`.

## Tests

`npm test` covers money parsing, salary-change rules, percentiles, the 10,000-person generator, and the SQLite directory including a full seed.
