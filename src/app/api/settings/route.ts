import { NextRequest, NextResponse } from "next/server";
import { getDb, runTransaction } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const update = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  );
  runTransaction(db, () => {
    for (const [k, v] of Object.entries(body)) update.run(k, v as string);
  });
  return NextResponse.json({ ok: true });
}
