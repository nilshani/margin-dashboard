"use client";

import { cn } from "@/lib/utils";

interface MarginBadgeProps {
  value: number; // 0–1
  className?: string;
}

export function MarginBadge({ value, className }: MarginBadgeProps) {
  const pct = value * 100;
  const color =
    pct >= 30
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 10
      ? "bg-yellow-100 text-yellow-700"
      : pct >= 0
      ? "bg-orange-100 text-orange-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", color, className)}>
      {pct.toFixed(1)}%
    </span>
  );
}

interface ProgressBarProps {
  value: number; // 0–1
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-600 w-10 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
