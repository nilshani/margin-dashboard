import * as XLSX from "xlsx";
import { parseMonthYear } from "./timesheet";

export interface SalaryRow {
  employee_name: string;
  year: number;
  month: number;
  salary: number;
}

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function normalizeHeader(h: unknown): string {
  return h?.toString().toLowerCase().replace(/[\s_\-\/]+/g, "_").trim() ?? "";
}

function clean(v: unknown): string {
  const s = v?.toString().trim() ?? "";
  return s === "-" || s === "–" || s === "—" ? "" : s;
}

export function parseSalary(buffer: Buffer): {
  rows: SalaryRow[];
  errors: string[];
} {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const rows: SalaryRow[] = [];
  const errors: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");

    // Find the header row — look for a row containing month names
    let headerRowIdx = -1;
    let nameColIdx = -1;
    const monthCols: { colIdx: number; month: number; year: number }[] = [];

    for (let r = 0; r <= Math.min(15, range.e.r); r++) {
      const rowCells: string[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        rowCells.push(cell?.v?.toString() ?? "");
      }
      const norm = rowCells.map(normalizeHeader);

      // Check if this row has month names
      const foundMonths = norm.filter((h) =>
        MONTH_NAMES.some((m) => h.startsWith(m))
      );

      if (foundMonths.length >= 3) {
        headerRowIdx = r;
        // Find name column
        nameColIdx = norm.findIndex(
          (h) => h.includes("employee") || h.includes("name") || h === "emp_name"
        );
        if (nameColIdx < 0) nameColIdx = 0; // fallback: first column

        // Map month columns — try to extract year from header cell
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c })];
          const raw = cell?.v?.toString() ?? "";
          const parsed = parseMonthYear(raw);
          if (parsed) {
            monthCols.push({ colIdx: c, month: parsed.month, year: parsed.year });
          }
        }
        break;
      }
    }

    if (headerRowIdx < 0 || monthCols.length === 0) {
      errors.push(`Sheet "${sheetName}": could not find salary month columns`);
      continue;
    }

    // If year wasn't in headers, try to infer from sheet name or use current year
    // (parseMonthYear already handles "January" → current year fallback)

    for (let r = headerRowIdx + 1; r <= range.e.r; r++) {
      const nameCell = sheet[XLSX.utils.encode_cell({ r, c: nameColIdx })];
      const empName = clean(nameCell?.v);
      if (!empName) continue;

      for (const { colIdx, month, year } of monthCols) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
        const raw = clean(cell?.v);
        if (!raw) continue;
        const salary = parseFloat(raw.replace(/,/g, "")) || 0;
        if (salary > 0) {
          rows.push({ employee_name: empName, year, month, salary });
        }
      }
    }
  }

  return { rows, errors };
}
