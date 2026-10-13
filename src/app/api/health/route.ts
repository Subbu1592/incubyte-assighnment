import { NextResponse } from "next/server";
import { getDb } from "../../../db/database";
import { employeeCount } from "../../../server/insights";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ ok: true, employees: employeeCount(getDb()) });
}
