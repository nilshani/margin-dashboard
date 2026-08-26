import { NextResponse } from "next/server";
import { getDb, resetToDemoData } from "@/lib/db";

export async function POST() {
  resetToDemoData(getDb());
  return NextResponse.json({ ok: true, message: "Demo data loaded" });
}