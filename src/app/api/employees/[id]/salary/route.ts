import { NextResponse } from "next/server";
import { getDb } from "../../../../../db/database";
import { todayIso } from "../../../../../domain/dates";
import { changeSalary } from "../../../../../server/employees";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const result = changeSalary(getDb(), numeric, body, todayIso());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
