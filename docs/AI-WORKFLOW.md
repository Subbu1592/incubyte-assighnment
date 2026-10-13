# How AI was used

The assessment asks for intentional use of an agent, with the engineer still responsible for the result. This file is the record of that.

## Sequence

The agent was not asked to “build a salary app” in one undifferentiated pass.

1. **Scope first.** The persona, the questions HR must answer, and the explicit exclusions were written in `docs/REQUIREMENTS.md` before application code. Payroll, tax, live FX, and employee login were rejected there so they would not leak into the implementation.
2. **Rules before UI.** Money parsing, salary-change planning, percentiles, and the workforce generator were specified as pure functions with tests. The interface calls those functions. It does not reimplement them.
3. **A failure mode was designed in.** Exactly one open salary is both a domain plan and a partial unique index. The agent was pointed at that invariant so a form could not “mostly work” while corrupting history.
4. **Product judgment stayed explicit.** Outliers are judged inside a country and level, not on a global USD rank. That decision is in the requirements and the insight code, because a naive aggregate would answer the wrong question.
5. **Review after generation.** Tests were run and treated as the check on the generated code. Seed size, paging, and the transaction around a pay change were inspected, not assumed.

## What the agent did well

- Scaffolding the Next.js and SQLite structure.
- Drafting a deterministic generator and the page layout.
- Turning the salary rules into table-driven tests.

## What was not delegated

- Whether this system pays people or only records pay.
- The currency model.
- What “outside the band” means.
- The choice to keep one Node process and a file database.

## A correction during the build

`better-sqlite3` did not compile on this machine because the Xcode license was not accepted, so the native addon could not be built. Database access was switched to Node’s built-in `node:sqlite`. The schema, the one-open-salary index, and the tests stayed the same. That is the dependency I would choose again: no compile step, same SQL.

## Commit history

Commits are split by layer: requirements, project setup, domain, database, server API, interface, then the runbook. They were produced in one working session with the agent. The timestamps are close together on purpose. The split is so a reviewer can read the evolution, not so the history pretends to be several days of solo work.
