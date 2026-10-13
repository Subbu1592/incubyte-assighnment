import { NextResponse } from "next/server";
import { getDb } from "../../../db/database";
import { parseCountry } from "../../../domain/query";
import { getInsights } from "../../../server/insights";

export const runtime = "nodejs";

export function GET(request: Request) {
  const country = parseCountry(new URL(request.url).searchParams.get("country") ?? undefined);
  return NextResponse.json(getInsights(getDb(), country));
}
