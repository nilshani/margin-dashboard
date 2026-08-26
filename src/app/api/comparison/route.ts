import { NextResponse } from "next/server";
import { getYearComparison } from "@/lib/calculations";

export async function GET() {
  return NextResponse.json({ rows: getYearComparison() });
}