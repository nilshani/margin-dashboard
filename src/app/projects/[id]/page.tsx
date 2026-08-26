"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MetricCard } from "@/components/metric-card";
import { DataTable, Column } from "@/components/data-table";
import { MarginBadge } from "@/components/badges";
import { fmtCurrency, fmtHours, fmtPct } from "@/lib/utils";

interface ProjectDetail {
  project: {
    ref_code: string;
    project_name: string;
    price: number;
    sales_month: string;
    category: string;
    status: string;
  };
  totalHours: number;
  totalCost: number;
  profit: number;
  margin: number;
  byDepartment: { dept: string; hours: number; cost: number }[];
  employees: {
    name: string;
    department: string;
    designation: string;
    hours: number;
    cost: number;
    revenueShare: number;
    profitability: number;
  }[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        Project not found.{" "}
        <button onClick={() => router.back()} className="underline">
          Go back
        </button>
      </div>
    );

  if (!data) return <div className="p-8 text-gray-400">Loading…</div>;

  const { project, totalHours, totalCost, profit, margin, byDepartment, employees } = data;

  const deptColumns: Column<(typeof byDepartment)[0]>[] = [
    { key: "dept", label: "Department" },
    { key: "hours", label: "Hours", align: "right", render: (r) => fmtHours(r.hours) },
    { key: "cost", label: "Cost", align: "right", render: (r) => fmtCurrency(r.cost) },
    {
      key: "pct",
      label: "% of Hours",
      align: "right",
      render: (r) => fmtPct(totalHours > 0 ? r.hours / totalHours : 0),
    },
  ];

  const empColumns: Column<(typeof employees)[0]>[] = [
    { key: "name", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Role" },
    { key: "hours", label: "Hours", align: "right", render: (r) => fmtHours(r.hours) },
    { key: "cost", label: "Cost", align: "right", render: (r) => fmtCurrency(r.cost) },
    { key: "revenueShare", label: "Rev. Share", align: "right", render: (r) => fmtCurrency(r.revenueShare) },
    {
      key: "profitability",
      label: "Profitability",
      align: "right",
      render: (r) => <MarginBadge value={r.profitability} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{project.project_name}</h1>
          <p className="text-sm text-gray-500">
            {project.ref_code} · {project.category} · {project.status}
            {project.sales_month ? ` · Sold ${project.sales_month}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Price" value={fmtCurrency(project.price)} />
        <MetricCard label="Total Hours" value={fmtHours(totalHours)} />
        <MetricCard label="Total Cost" value={fmtCurrency(totalCost)} />
        <MetricCard label="Profit" value={fmtCurrency(profit)} trend={profit >= 0 ? "up" : "down"} />
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Margin</span>
          <div className="mt-1">
            <MarginBadge value={margin} className="text-base px-3 py-1" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">By Department</h2>
        <DataTable
          columns={deptColumns}
          rows={byDepartment}
          csvFilename={`${project.ref_code}-departments.csv`}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Per Employee</h2>
        <DataTable
          columns={empColumns}
          rows={employees}
          csvFilename={`${project.ref_code}-employees.csv`}
        />
      </div>
    </div>
  );
}
