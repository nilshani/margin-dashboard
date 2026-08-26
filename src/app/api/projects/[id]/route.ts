import { NextRequest, NextResponse } from "next/server";
import { getProjectDetail } from "@/lib/calculations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = getProjectDetail(decodeURIComponent(id));
  if (!detail) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(detail);
}
