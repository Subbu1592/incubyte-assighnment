import { getDb, resetDatabase } from "./database";

const db = getDb();
if (process.argv.includes("--reset")) {
  const count = resetDatabase(db, Number(process.env.SEED_COUNT ?? 10000));
  console.log(`Reset Paybook with ${count} employees.`);
} else {
  const employees = db.prepare("SELECT COUNT(*) AS c FROM employees").get() as { c: number };
  const salaries = db.prepare("SELECT COUNT(*) AS c FROM salary_records").get() as { c: number };
  console.log(`Paybook ready: ${employees.c} employees, ${salaries.c} salary records.`);
}
