import { NextResponse } from "next/server";
import { getAuditRates } from "@/lib/calculations";

export async function GET() {
  return NextResponse.json({ rows: getAuditRates() });
}