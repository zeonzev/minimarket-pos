"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const RANGOS = [
  { id: "hoy", label: "Hoy" },
  { id: "7", label: "7 días" },
  { id: "30", label: "30 días" },
  { id: "mes", label: "Este mes" },
];

export default function DateFilter({
  rango,
  desde,
  hasta,
}: {
  rango: string;
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);

  return (
    <div className="no-print mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <div className="flex flex-wrap gap-1.5">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/reportes?rango=${r.id}`)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                rango === r.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-400" />
        <input
          type="date"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900"
        />
        <span className="text-xs text-slate-400">a</span>
        <input
          type="date"
          value={h}
          onChange={(e) => setH(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900"
        />
        <button
          onClick={() => d && h && router.push(`/reportes?desde=${d}&hasta=${h}`)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
