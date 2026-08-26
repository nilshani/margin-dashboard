import * as XLSX from "xlsx";

export interface ProjectRow {
  ref_code: string;
  project_name: string;
  price: number;
  sales_month: string;
  category: string;
  status: string;
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
      norm.some((h) => h.includes("ref")) &&
      norm.some((h) => h.includes("price") || h.includes("amount"))
    ) {
      return { rowIdx: r, headers: row };
    }
  }
  return null;
}

export function parseProjects(buffer: Buffer): {
  rows: ProjectRow[];
  errors: string[];
} {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const rows: ProjectRow[] = [];
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
      ref_code: col("ref_code", "ref"),
      project_name: col("project_name", "project", "name"),
      price: col("price", "amount", "value", "revenue"),
      sales_month: col("sales_month", "sales", "month"),
      category: col("category"),
      status: col("status"),
    };

    const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");

    for (let r = rowIdx + 1; r <= range.e.r; r++) {
      const get = (colIdx: number) => {
        if (colIdx < 0) return "";
        const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
        return clean(cell?.v);
      };

      const refCode = get(cols.ref_code);
      const projectName = get(cols.project_name);
      if (!refCode && !projectName) continue;

      const rawPrice = get(cols.price).replace(/,/g, "");
      const price = parseFloat(rawPrice) || 0;

      rows.push({
        ref_code: refCode,
        project_name: projectName,
        price,
        sales_month: get(cols.sales_month),
        category: get(cols.category),
        status: get(cols.status),
      });
    }
  }

  return { rows, errors };
}
