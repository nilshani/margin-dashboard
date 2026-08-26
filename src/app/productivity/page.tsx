"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { PeriodFilter } from "@/components/period-filter";
import { ProgressBar } from "@/components/badges";
import { fmtHours, periodLabel } from "@/lib/utils";

interface Row {
  employee_name: string;
  department: string;
  designation: string;
  total_hours: number;
  billable_hours: number;
}

interface Period { year: number; month: number; }

export default function ProductivityPage() {
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<{ rows: Row[]; periods: Period[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/productivity?${params}`).then((r) => r.json()).then(setData);
  }, [year, month]);

  const columns: Column<Row>[] = [
    { key: "employee_name", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Role" },
    { key: "total_hours", label: "Total Hours", align: "right", render: (r) => fmtHours(r.total_hours) },
    { key: "billable_hours", label: "Billable Hours", align: "right", render: (r) => fmtHours(r.billable_hours) },
    {
      key: "productivity",
      label: "Productivity",
      render: (r) => (
        <ProgressBar value={r.total_hours > 0 ? r.billable_hours / r.total_hours : 0} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Productivity</h1>
          <p className="text-sm text-gray-500">{periodLabel(year, month)}</p>
        </div>
        <PeriodFilter
          periods={data?.periods ?? []}
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m); }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        emptyMessage="No timesheet data loaded yet"
        csvFilename="productivity.csv"
      />
    </div>
  );
}
