"use client";

import { monthName } from "@/lib/utils";

interface Period {
  year: number;
  month: number;
}

interface PeriodFilterProps {
  periods: Period[];
  year?: number;
  month?: number;
  onChange: (year?: number, month?: number) => void;
}

export function PeriodFilter({ periods, year, month, onChange }: PeriodFilterProps) {
  const years = [...new Set(periods.map((p) => p.year))].sort();
  const months = year
    ? periods.filter((p) => p.year === year).map((p) => p.month).sort((a, b) => a - b)
    : [];

  return (
    <div className="flex gap-2 items-center">
      <select
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        value={year ?? ""}
        onChange={(e) => {
          const y = e.target.value ? parseInt(e.target.value) : undefined;
          onChange(y, undefined);
        }}
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {year && months.length > 0 && (
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={month ?? ""}
          onChange={(e) => {
            const m = e.target.value ? parseInt(e.target.value) : undefined;
            onChange(year, m);
          }}
        >
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>{monthName(m)}</option>
          ))}
        </select>
      )}
    </div>
  );
}
