import { NextResponse } from "next/server";
import { getDb } from "../../../db/database";
import { parseEmployeeQuery } from "../../../domain/query";
import { listEmployees } from "../../../server/employees";

export const runtime = "nodejs";

export function GET(request: Request) {
  const query = parseEmployeeQuery(new URL(request.url).searchParams);
  return NextResponse.json(listEmployees(getDb(), query));
}
