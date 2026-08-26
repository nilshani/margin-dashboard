import * as XLSX from "xlsx";

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

export function parseMonthYear(raw: string): { month: number; year: number } | null {
  if (!raw) return null;
  const cleaned = raw.toString().replace(/[''`]/g, "").toLowerCase().trim();

  // "may 25", "january 2026", "jan'25"
  const match = cleaned.match(/^([a-z]+)\s*(\d{2,4})$/);
  if (match) {
    const monthNum = MONTH_MAP[match[1]];
    if (!monthNum) return null;
    let year = parseInt(match[2]);
    if (year < 100) year += 2000;
    return { month: monthNum, year };
  }

  // Just month name — caller should supply year from context
  const monthOnly = MONTH_MAP[cleaned];
  if (monthOnly) return { month: monthOnly, year: new Date().getFullYear() };

  return null;
}

function normalizeHeader(h: unknown): string {
  return h?.toString().toLowerCase().replace(/[\s_\-\/]+/g, "_").trim() ?? "";
}

function clean(v: unknown): string {
  const s = v?.toString().trim() ?? "";
  return s === "-" || s === "–" || s === "—" ? "" : s;
}

function findHeaderRow(
  sheet: XLSX.WorkSheet
): { rowIdx: number; headers: string[] } | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  for (let r = 0; r <= Math.min(15, range.e.r); r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell?.v?.toString() ?? "");
    }
    const norm = row.map(normalizeHeader);
    if (
      norm.some((h) => h.includes("employee") || h.includes("emp_name")) &&
      norm.some((h) => h === "hours" || h === "hrs" || h.endsWith("_hours"))
    ) {
      return { rowIdx: r, headers: row };
    }
  }
  return null;
}

export interface TimesheetRow {
  month: number;
  year: number;
  employee_no: string;
  employee_name: string;
  expense_type: string;
  department: string;
  designation: string;
  category: string;
  ref_code: string;
  project_name: string;
  company: string;
  description: string;
  hours: number;
}

export function parseTimesheet(buffer: Buffer): {
  rows: TimesheetRow[];
  errors: string[];
} {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const rows: TimesheetRow[] = [];
  const errors: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const headerInfo = findHeaderRow(sheet);
    if (!headerInfo) {
      errors.push(`Sheet "${sheetName}": could not find header row`);
      continue;
    }

    const { rowIdx, headers } = headerInfo;
    const norm = headers.map(normalizeHeader);

    const col = (...names: string[]) => {
      for (const n of names) {
        const idx = norm.findIndex((h) => h.includes(n));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const cols = {
      month: col("month"),
      emp_no: col("employee_no", "emp_no", "employee_number"),
      emp_name: col("employee_name", "emp_name"),
      expense_type: col("type_of_expense", "expense_type", "type"),
      department: col("department", "dept"),
      designation: col("designation", "role", "position"),
      category: col("category"),
      ref_code: col("ref_code", "ref"),
      project: col("project", "task_name"),
      company: col("company"),
      description: col("description", "desc"),
      hours: col("hours", "hrs"),
    };

    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");

    for (let r = rowIdx + 1; r <= range.e.r; r++) {
      const get = (colIdx: number) => {
        if (colIdx < 0) return "";
        const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
        return clean(cell?.v);
      };

      const rawMonth = get(cols.month);
      const empName = get(cols.emp_name);
      if (!empName || !rawMonth) continue;

      const parsed = parseMonthYear(rawMonth);
      if (!parsed) {
        errors.push(`Row ${r + 1}: unrecognised month "${rawMonth}"`);
        continue;
      }

      const hours = parseFloat(get(cols.hours)) || 0;

      rows.push({
        month: parsed.month,
        year: parsed.year,
        employee_no: get(cols.emp_no),
        employee_name: empName,
        expense_type: get(cols.expense_type),
        department: get(cols.department),
        designation: get(cols.designation),
        category: get(cols.category),
        ref_code: get(cols.ref_code),
        project_name: get(cols.project),
        company: get(cols.company),
        description: get(cols.description),
        hours,
      });
    }
  }

  return { rows, errors };
}
