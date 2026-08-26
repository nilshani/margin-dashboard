import { NextRequest, NextResponse } from "next/server";
import { getDb, runTransaction } from "@/lib/db";
import { parseTimesheet } from "@/lib/parsers/timesheet";
import { parseSalary } from "@/lib/parsers/salary";
import { parseProjects } from "@/lib/parsers/projects";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const salaryYearValue = formData.get("salaryYear");
  const salaryYear = salaryYearValue ? parseInt(String(salaryYearValue), 10) : undefined;

  if (!file || !type) {
    return NextResponse.json({ error: "Missing file or type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const db = getDb();

  try {
    if (type === "timesheet") {
      const { rows, errors } = parseTimesheet(buffer);
      const insert = db.prepare(`
        INSERT INTO timesheet_entries
          (year, month, employee_no, employee_name, expense_type, department,
           designation, category, ref_code, project_name, company, description, hours)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(year, month, employee_name, ref_code, project_name, description)
        DO UPDATE SET hours=excluded.hours, department=excluded.department,
          designation=excluded.designation, category=excluded.category,
          expense_type=excluded.expense_type, company=excluded.company
      `);
      runTransaction(db, () => {
        for (const r of rows) {
          insert.run(
            r.year, r.month, r.employee_no, r.employee_name, r.expense_type,
            r.department, r.designation, r.category, r.ref_code,
            r.project_name, r.company, r.description, r.hours
          );
        }
      });
      return NextResponse.json({ inserted: rows.length, errors });
    }

    if (type === "salary") {
      const { rows, errors } = parseSalary(buffer, salaryYear);
      const insert = db.prepare(`
        INSERT INTO salary_entries (employee_name, year, month, salary)
        VALUES (?,?,?,?)
        ON CONFLICT(employee_name, year, month) DO UPDATE SET salary=excluded.salary
      `);
      runTransaction(db, () => {
        for (const r of rows) insert.run(r.employee_name, r.year, r.month, r.salary);
      });
      return NextResponse.json({ inserted: rows.length, errors });
    }

    if (type === "projects") {
      const { rows, errors } = parseProjects(buffer);
      const insert = db.prepare(`
        INSERT INTO projects (ref_code, project_name, price, sales_month, category, status)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(ref_code) DO UPDATE SET
          project_name=excluded.project_name, price=excluded.price,
          sales_month=excluded.sales_month, category=excluded.category,
          status=excluded.status
      `);
      runTransaction(db, () => {
        for (const r of rows) {
          insert.run(r.ref_code, r.project_name, r.price, r.sales_month, r.category, r.status);
        }
      });
      return NextResponse.json({ inserted: rows.length, errors });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
