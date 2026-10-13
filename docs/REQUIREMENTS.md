# ACME Paybook — Requirements

## Goal

Give ACME’s HR manager one place to keep salary records for 10,000 employees and to answer questions about how the organization pays people. Today those answers live in spreadsheets spread across countries.

Paybook is a compensation system of record and an inquiry tool. It is not a payroll engine.

## Who it is for

One persona: the HR manager. They look up a person, record a pay change, and read org-wide patterns. Employees do not sign in.

## In scope

1. **Directory.** Search by name, email, or employee code. Filter by country, department, level, and status. Results are paged so a 10,000-person list is never rendered at once.
2. **System of record.** Salary history is stored in the employee’s local currency. Exactly one record is current. A new salary closes the previous record on the day before the new effective date.
3. **Pay change.** HR enters a new annual amount, currency, effective date, and reason (merit, promotion, market adjustment, correction, relocation, role change). Decreases are allowed, because corrections happen. A promotion can also update level.
4. **Questions the overview answers**
   - What is the active payroll, and what is median pay?
   - How is that pay spread across countries, departments, and levels?
   - Who sits outside the usual range for the same country and level?
5. **Pay bands.** Each level shows the 10th, 25th, 50th, 75th, and 90th percentile. A country filter switches the band to that market.
6. **Comparison currency.** Cross-country totals use a fixed USD rate card dated 1 Oct 2026. Local currency remains what is stored.
7. **Seed.** A deterministic script creates 10,000 employees with country, level, and salary history so the app is usable on first run.

Active and on-leave employees count toward payroll. Terminated employees stay in the directory and drop out of the totals.

## Deliberately left out

- **Payroll, tax, and bank files.** Paying people is a different system with legal rules per country. Keeping it out makes the salary record easier to trust.
- **Live foreign exchange.** A moving rate would change “what do we pay?” overnight without a salary decision. The rate card is visible and replaceable.
- **Benefits, equity, and bonuses.** The question in scope is base salary.
- **Approval chains and employee logins.** One HR actor is enough to prove the record and the questions. Authentication can sit in front later without changing the model.
- **Full job history.** The directory shows the current role. Earlier promotions appear as salary events, not as a timeline of every title.

## Done when

An HR manager can replace the spreadsheet for lookup and for the questions above, on the full population, with tests around money, history, and the aggregates.
