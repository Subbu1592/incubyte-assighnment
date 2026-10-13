import { NextResponse } from "next/server";
import { getDb } from "../../../../db/database";
import { getEmployee } from "../../../../server/employees";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  const employee = getEmployee(getDb(), numeric);
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json(employee);
}
