"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { fmtCurrency, fmtHours, monthName } from "@/lib/utils";

interface Row {
  year: number;
  month: number;
  salary: number;
  overhead: number;
  totalHours: number;
  billableHours: number;
  nonBillableCost: number;
  directRate: number;
  indirectRate: number;
  totalCost: number;
}

export default function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/audit").then((response) => response.json()).then((data) => setRows(data.rows ?? []));
  }, []);

  const columns: Column<Row>[] = [
    { key: "period", label: "Period", render: (row) => `${monthName(row.month)} ${row.year}` },
    { key: "salary", label: "Salary Pool", align: "right", render: (row) => fmtCurrency(row.salary) },
    { key: "overhead", label: "Overhead", align: "right", render: (row) => fmtCurrency(row.overhead) },
    { key: "totalHours", label: "Total Hours", align: "right", render: (row) => fmtHours(row.totalHours) },
    { key: "billableHours", label: "Billable Hours", align: "right", render: (row) => fmtHours(row.billableHours) },
    { key: "nonBillableCost", label: "Non-billable Cost", align: "right", render: (row) => fmtCurrency(row.nonBillableCost) },
    { key: "directRate", label: "Direct Rate / h", align: "right", render: (row) => fmtCurrency(row.directRate) },
    { key: "indirectRate", label: "Indirect Rate / h", align: "right", render: (row) => fmtCurrency(row.indirectRate) },
    { key: "totalCost", label: "Allocated Cost", align: "right", render: (row) => fmtCurrency(row.totalCost) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Cost Rate Audit</h1>
        <p className="text-sm text-gray-500 mt-1">Monthly inputs and rates used to derive project costs.</p>
      </div>
      <DataTable columns={columns} rows={rows} emptyMessage="No monthly cost data available" csvFilename="cost-rate-audit.csv" />
    </div>
  );
}