"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { PeriodFilter } from "@/components/period-filter";
import { MarginBadge } from "@/components/badges";
import { fmtCurrency, fmtHours, fmtPct, periodLabel } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Metrics {
  totalHours: number;
  billableHours: number;
  totalCost: number;
  totalRevenue: number;
  margin: number;
  productivity: number;
  warnings: string[];
}

interface Period { year: number; month: number; }

export default function DashboardPage() {
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<{ metrics: Metrics; periods: Period[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    fetch(`/api/dashboard?${params}`).then((r) => r.json()).then(setData);
  }, [year, month]);

  const m = data?.metrics;
  const periods = data?.periods ?? [];

  const chartData = m
    ? [
        { name: "Revenue", value: m.totalRevenue, fill: "#0ea5e9" },
        { name: "Cost", value: m.totalCost, fill: "#f97316" },
        { name: "Profit", value: m.totalRevenue - m.totalCost, fill: m.totalRevenue - m.totalCost >= 0 ? "#10b981" : "#ef4444" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{periodLabel(year, month)}</p>
        </div>
        <PeriodFilter
          periods={periods}
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m); }}
        />
      </div>

      {m?.warnings && m.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-800">Data gaps detected</span>
          {m.warnings.map((w, i) => (
            <span key={i} className="text-xs text-amber-700">{w}</span>
          ))}
        </div>
      )}

      {!m && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center text-sm text-blue-700">
          No data yet — go to <a href="/upload" className="underline font-medium">Upload</a> to load your spreadsheets.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Total Hours" value={fmtHours(m?.totalHours ?? 0)} />
        <MetricCard
          label="Billable Hours"
          value={fmtHours(m?.billableHours ?? 0)}
          sub={m ? fmtPct(m.productivity) + " of total" : undefined}
        />
        <MetricCard label="Total Cost" value={fmtCurrency(m?.totalCost ?? 0)} />
        <MetricCard label="Revenue" value={fmtCurrency(m?.totalRevenue ?? 0)} />
        <MetricCard
          label="Profit"
          value={fmtCurrency((m?.totalRevenue ?? 0) - (m?.totalCost ?? 0))}
          trend={(m?.totalRevenue ?? 0) - (m?.totalCost ?? 0) >= 0 ? "up" : "down"}
        />
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Margin</span>
          <div className="mt-1">
            <MarginBadge value={m?.margin ?? 0} className="text-base px-3 py-1" />
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Revenue vs Cost vs Profit</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={48}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => "AED " + (v / 1000).toFixed(0) + "k"}
              />
              <Tooltip
                formatter={(v: number) => fmtCurrency(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
