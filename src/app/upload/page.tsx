"use client";

import { useState } from "react";
import { UploadZone } from "@/components/upload-zone";

interface UploadResult { inserted: number; errors: string[]; }

export default function UploadPage() {
  const [results, setResults] = useState<Record<string, UploadResult>>({});

  const handleDone = (type: string) => (result: UploadResult) => {
    setResults((prev) => ({ ...prev, [type]: result }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Upload Spreadsheets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload all three files. Re-uploading a corrected file will update existing rows without duplicating data.
        </p>
      </div>

      <div className="grid gap-4">
        <UploadZone type="timesheet" label="Timesheet (hours per person per task)" onDone={handleDone("timesheet")} />
        <UploadZone type="salary" label="Salary Overview (one row per person, months as columns)" onDone={handleDone("salary")} />
        <UploadZone type="projects" label="Project Prices (ref code, name, price)" onDone={handleDone("projects")} />
      </div>

      {Object.entries(results).map(([type, result]) =>
        result.errors?.length > 0 ? (
          <div key={type} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">{type} — parse warnings</p>
            <ul className="text-xs text-amber-700 space-y-0.5 max-h-40 overflow-auto">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        ) : null
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">Expected formats</p>
        <p>Timesheet: one row per person/task/month. Columns: Month, Employee Name, Category, Ref Code, Hours (and others).</p>
        <p>Salary: one row per person, month names as column headers (e.g. "January 2025" or "Jan '25").</p>
        <p>Projects: one row per project. Columns: Ref Code, Project Name, Project Price, Sales Month, Category, Status.</p>
      </div>
    </div>
  );
}
