"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/data-table";
import { PeriodFilter } from "@/components/period-filter";
import { ProgressBar } from "@/components/badges";
import { fmtHours, periodLabel } from "@/lib/utils";

interface Row {
  department: string;
  total_hours: number;
  billable_hours: number;
  people: number;
}

interface Period { year: number; month: number; }

export default function DepartmentsPage() {
  const router = useRouter();
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<{ rows: Row[]; periods: Period[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/departments?${params}`).then((r) => r.json()).then(setData);
  }, [year, month]);

  const columns: Column<Row>[] = [
    { key: "department", label: "Department" },
    { key: "people", label: "People", align: "right" },
    { key: "total_hours", label: "Total Hours", align: "right", render: (r) => fmtHours(r.total_hours) },
    { key: "billable_hours", label: "Billable Hours", align: "right", render: (r) => fmtHours(r.billable_hours) },
    {
      key: "productivity",
      label: "Billable %",
      render: (r) => (
        <ProgressBar value={r.total_hours > 0 ? r.billable_hours / r.total_hours : 0} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
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
        onRowClick={(row) => router.push(`/departments/${encodeURIComponent(row.department)}`)}
        emptyMessage="No timesheet data loaded yet"
        csvFilename="departments.csv"
      />
    </div>
  );
}
