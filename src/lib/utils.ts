import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtCurrency(n: number) {
  return "AED " + fmt(n, 0);
}

export function fmtPct(n: number) {
  return (n * 100).toFixed(1) + "%";
}

export function fmtHours(n: number) {
  return fmt(n, 1) + " h";
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthName(m: number) {
  return MONTH_NAMES[m] ?? String(m);
}

export function periodLabel(year?: number, month?: number) {
  if (year && month) return `${monthName(month)} ${year}`;
  if (year) return String(year);
  return "All time";
}
