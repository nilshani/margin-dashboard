"use client";

import { useEffect, useState } from "react";

const DEFAULT_BILLABLE = ["Projects", "Enhancements", "Hosting"];

export default function SettingsPage() {
  const [overhead, setOverhead] = useState("0");
  const [billable, setBillable] = useState(DEFAULT_BILLABLE.join(", "));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setOverhead(s.overhead_monthly ?? "0");
        try {
          const cats = JSON.parse(s.billable_categories ?? "[]") as string[];
          setBillable(cats.join(", "));
        } catch {}
      });
  }, []);

  async function save() {
    let cats: string[];
    try {
      cats = billable.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      cats = DEFAULT_BILLABLE;
    }
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overhead_monthly: overhead,
        billable_categories: JSON.stringify(cats),
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure assumptions used in cost calculations.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Monthly Overhead (AED)</label>
          <input
            type="number"
            min="0"
            value={overhead}
            onChange={(e) => setOverhead(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400">
            Added to the indirect cost pool each month (rent, software, etc.). Set to 0 to reconcile total cost = total salaries.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Billable Categories</label>
          <input
            type="text"
            value={billable}
            onChange={(e) => setBillable(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400">
            Comma-separated. Hours in these categories count as billable. Default: Projects, Enhancements, Hosting.
          </p>
        </div>

        <button
          onClick={save}
          className="self-start bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">Self-check</p>
        <p>With overhead set to 0, total company cost across a full year should equal total salaries to the dirham.</p>
        <p>If it doesn't, check for employees with hours but no salary row (shown as warnings on the Dashboard).</p>
      </div>
    </div>
  );
}
