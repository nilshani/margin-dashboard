"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { PeriodFilter } from "@/components/period-filter";
import { fmtHours, periodLabel } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Row {
  category: string;
  hours: number;
  people: number;
}

interface Period { year: number; month: number; }

const COLORS = ["#0ea5e9","#10b981","#f97316","#8b5cf6","#f43f5e","#eab308","#06b6d4","#84cc16"];

export default function CategoriesPage() {
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<{ rows: Row[]; periods: Period[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/categories?${params}`).then((r) => r.json()).then(setData);
  }, [year, month]);

  const rows = data?.rows ?? [];
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);

  const columns: Column<Row>[] = [
    { key: "category", label: "Category" },
    { key: "people", label: "People", align: "right" },
    { key: "hours", label: "Hours", align: "right", render: (r) => fmtHours(r.hours) },
    {
      key: "pct",
      label: "% of Total",
      align: "right",
      render: (r) => totalHours > 0 ? (r.hours / totalHours * 100).toFixed(1) + "%" : "—",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{periodLabel(year, month)}</p>
        </div>
        <PeriodFilter
          periods={data?.periods ?? []}
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m); }}
        />
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={rows}
                dataKey="hours"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtHours(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No timesheet data loaded yet"
        csvFilename="categories.csv"
      />
    </div>
  );
}
