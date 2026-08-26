"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  type: "timesheet" | "salary" | "projects";
  label: string;
  year?: number;
  onDone: (result: { inserted: number; errors: string[] }) => void;
}

export function UploadZone({ type, label, year, onDone }: UploadZoneProps) {
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setState("uploading");
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    if (year) fd.append("salaryYear", String(year));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setState("done");
      setMessage(`${data.inserted} rows loaded${data.errors?.length ? ` · ${data.errors.length} warnings` : ""}`);
      onDone(data);
    } catch (e: unknown) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Upload failed");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-colors cursor-pointer",
        dragging ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300",
        state === "done" && "border-emerald-300 bg-emerald-50",
        state === "error" && "border-red-300 bg-red-50"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />
      <div className="text-2xl">
        {state === "uploading" ? "⏳" : state === "done" ? "✅" : state === "error" ? "❌" : "📂"}
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {state === "idle" && (
        <div className="text-xs text-gray-400">Drop .xlsx here or click to browse</div>
      )}
      {message && (
        <div className={cn("text-xs", state === "error" ? "text-red-600" : "text-emerald-700")}>
          {message}
        </div>
      )}
    </div>
  );
}
