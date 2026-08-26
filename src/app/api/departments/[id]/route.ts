import { NextRequest, NextResponse } from "next/server";
import { getAvailablePeriods, getDepartmentDetail } from "@/lib/calculations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
  return NextResponse.json({
    department: decodeURIComponent(id),
    rows: getDepartmentDetail(decodeURIComponent(id), { year, month }),
    periods: getAvailablePeriods(),
  });
}