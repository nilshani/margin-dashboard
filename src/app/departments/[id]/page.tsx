"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/data-table";
import { PeriodFilter } from "@/components/period-filter";
import { ProgressBar } from "@/components/badges";
import { fmtHours, periodLabel } from "@/lib/utils";

interface Row {
  employee_name: string;
  designation: string;
  total_hours: number;
  billable_hours: number;
}

interface Period { year: number; month: number; }

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<{ department: string; rows: Row[]; periods: Period[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/departments/${encodeURIComponent(id)}?${params}`)
      .then((response) => response.json())
      .then(setData);
  }, [id, year, month]);

  const columns: Column<Row>[] = [
    { key: "employee_name", label: "Employee" },
    { key: "designation", label: "Role" },
    { key: "total_hours", label: "Total Hours", align: "right", render: (row) => fmtHours(row.total_hours) },
    { key: "billable_hours", label: "Billable Hours", align: "right", render: (row) => fmtHours(row.billable_hours) },
    {
      key: "productivity",
      label: "Billable %",
      render: (row) => <ProgressBar value={row.total_hours > 0 ? row.billable_hours / row.total_hours : 0} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">Back to departments</button>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">{data?.department ?? decodeURIComponent(id)}</h1>
          <p className="text-sm text-gray-500">{periodLabel(year, month)}</p>
        </div>
        <PeriodFilter periods={data?.periods ?? []} year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />
      </div>
      <DataTable columns={columns} rows={data?.rows ?? []} emptyMessage="No people found in this department" csvFilename="department-employees.csv" />
    </div>
  );
}