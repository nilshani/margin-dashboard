import { NextRequest, NextResponse } from "next/server";
import { getProductivity, getAvailablePeriods } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

  const rows = getProductivity({ year, month });
  const periods = getAvailablePeriods();

  return NextResponse.json({ rows, periods });
}
