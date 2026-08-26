"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, sub, trend, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-gray-900">{value}</span>
      {sub && (
        <span
          className={cn(
            "text-sm",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-red-500",
            (!trend || trend === "neutral") && "text-gray-500"
          )}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
