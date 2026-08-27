"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/projects", label: "Projects", icon: "◈" },
  { href: "/productivity", label: "Productivity", icon: "◎" },
  { href: "/categories", label: "Categories", icon: "◉" },
  { href: "/departments", label: "Departments", icon: "◫" },
  { href: "/upload", label: "Upload", icon: "↑" },
  { href: "/settings", label: "Settings", icon: "⚙" },
  { href: "/matrix", label: "Matrix", icon: "⊞" },
  { href: "/comparison", label: "Year Comparison", icon: "⇄" },
  { href: "/audit", label: "Cost Audit", icon: "⌁" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col py-6 px-3 gap-1">
      <div className="px-3 mb-4">
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Margin</span>
      </div>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === l.href
              ? "bg-brand-50 text-brand-600 font-medium"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <span className="text-base leading-none">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
