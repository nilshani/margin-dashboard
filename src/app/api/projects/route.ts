import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, getAvailablePeriods } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

  const projects = getAllProjects({ year, month });
  const periods = getAvailablePeriods();

  return NextResponse.json({ projects, periods });
}
