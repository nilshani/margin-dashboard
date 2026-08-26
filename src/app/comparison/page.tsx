"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { MarginBadge } from "@/components/badges";
import { fmtCurrency, fmtHours, fmtPct } from "@/lib/utils";

interface Row {
  year: number;
  totalHours: number;
  billableHours: number;
  totalCost: number;
  totalRevenue: number;
  margin: number;
  productivity: number;
  warnings: string[];
}

export default function ComparisonPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/comparison").then((response) => response.json()).then((data) => setRows(data.rows ?? []));
  }, []);

  const columns: Column<Row>[] = [
    { key: "year", label: "Year" },
    { key: "totalHours", label: "Total Hours", align: "right", render: (row) => fmtHours(row.totalHours) },
    { key: "billableHours", label: "Billable Hours", align: "right", render: (row) => fmtHours(row.billableHours) },
    { key: "productivity", label: "Productivity", align: "right", render: (row) => fmtPct(row.productivity) },
    { key: "totalCost", label: "Cost", align: "right", render: (row) => fmtCurrency(row.totalCost) },
    { key: "totalRevenue", label: "Revenue", align: "right", render: (row) => fmtCurrency(row.totalRevenue) },
    { key: "margin", label: "Margin", align: "right", render: (row) => <MarginBadge value={row.margin} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Year Comparison</h1>
        <p className="text-sm text-gray-500 mt-1">Compare loaded years side by side using the same cost assumptions.</p>
      </div>
      <DataTable columns={columns} rows={rows} emptyMessage="No multi-year data available" csvFilename="year-comparison.csv" />
    </div>
  );
}