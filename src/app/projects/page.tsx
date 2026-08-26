"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/data-table";
import { PeriodFilter } from "@/components/period-filter";
import { MarginBadge } from "@/components/badges";
import { fmtCurrency, fmtHours, periodLabel } from "@/lib/utils";

interface Project {
  ref_code: string;
  project_name: string;
  price: number;
  category: string;
  status: string;
  totalHours: number;
  totalCost: number;
  margin: number;
}

interface Period { year: number; month: number; }

export default function ProjectsPage() {
  const router = useRouter();
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<{ projects: Project[]; periods: Period[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/projects?${params}`).then((r) => r.json()).then(setData);
  }, [year, month]);

  const columns: Column<Project>[] = [
    { key: "ref_code", label: "Ref", className: "font-mono text-xs text-gray-500" },
    { key: "project_name", label: "Project" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "price", label: "Price", align: "right", render: (r) => fmtCurrency(r.price) },
    { key: "totalHours", label: "Hours", align: "right", render: (r) => fmtHours(r.totalHours) },
    { key: "totalCost", label: "Cost", align: "right", render: (r) => fmtCurrency(r.totalCost) },
    {
      key: "margin",
      label: "Margin",
      align: "right",
      render: (r) => r.price > 0 ? <MarginBadge value={r.margin} /> : <span className="text-gray-400 text-xs">No price</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
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
        rows={data?.projects ?? []}
        onRowClick={(r) => router.push(`/projects/${encodeURIComponent(r.ref_code)}`)}
        emptyMessage="No projects — upload a project prices file first"
        csvFilename="projects.csv"
      />
    </div>
  );
}
