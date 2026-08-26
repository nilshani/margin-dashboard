"use client";

import { useEffect, useState } from "react";
import { PeriodFilter } from "@/components/period-filter";
import { fmtHours, periodLabel } from "@/lib/utils";

interface Period { year: number; month: number; }

interface MatrixData {
  employees: string[];
  categories: string[];
  matrix: Record<string, Record<string, number>>;
  periods: Period[];
}

export default function MatrixPage() {
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<MatrixData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/matrix?${params}`).then((r) => r.json()).then(setData);
  }, [year, month]);

  function exportCsv() {
    if (!data) return;
    const header = ["Employee", ...data.categories].join(",");
    const body = data.employees.map((emp) => {
      const total = data.categories.reduce((s, cat) => s + (data.matrix[emp]?.[cat] ?? 0), 0);
      const cols = data.categories.map((cat) => data.matrix[emp]?.[cat]?.toFixed(1) ?? "0.0");
      return [emp, ...cols, total.toFixed(1)].join(",");
    });
    const blob = new Blob([[header + ",Total", ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matrix.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const employees = data?.employees ?? [];
  const categories = data?.categories ?? [];
  const matrix = data?.matrix ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Employee × Category Matrix</h1>
          <p className="text-sm text-gray-500">{periodLabel(year, month)}</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter
            periods={data?.periods ?? []}
            year={year}
            month={month}
            onChange={(y, m) => { setYear(y); setMonth(m); }}
          />
          {employees.length > 0 && (
            <button
              onClick={exportCsv}
              className="text-xs text-brand-600 hover:text-brand-500 border border-brand-200 rounded px-2 py-1"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
          No timesheet data loaded yet
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="text-sm w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap sticky left-0 bg-gray-50">
                  Employee
                </th>
                {categories.map((cat) => (
                  <th key={cat} className="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap">
                    {cat}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const total = categories.reduce((s, cat) => s + (matrix[emp]?.[cat] ?? 0), 0);
                return (
                  <tr key={emp} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2.5 text-gray-800 whitespace-nowrap sticky left-0 bg-inherit font-medium">
                      {emp}
                    </td>
                    {categories.map((cat) => {
                      const val = matrix[emp]?.[cat] ?? 0;
                      return (
                        <td key={cat} className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                          {val > 0 ? fmtHours(val) : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900">
                      {fmtHours(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-2.5 font-semibold text-gray-700 sticky left-0 bg-gray-50">
                  Total
                </td>
                {categories.map((cat) => {
                  const total = employees.reduce((s, emp) => s + (matrix[emp]?.[cat] ?? 0), 0);
                  return (
                    <td key={cat} className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-700">
                      {fmtHours(total)}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-gray-900">
                  {fmtHours(employees.reduce((s, emp) =>
                    s + categories.reduce((s2, cat) => s2 + (matrix[emp]?.[cat] ?? 0), 0), 0
                  ))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
