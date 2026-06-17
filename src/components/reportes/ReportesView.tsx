"use client";

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Printer, Download } from "lucide-react";
import { Card } from "@/components/ui";
import { formatBs } from "@/lib/utils";

const COLORS = ["#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#64748b"];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
  fontSize: 13,
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function ReportesView({
  diarias,
  categorias,
  topProductos,
  metodos,
  usuarios,
  rangoLabel = "Período seleccionado",
}: {
  diarias: { dia: string; total: number }[];
  categorias: { categoria: string; total: number }[];
  topProductos: { nombre: string; cantidad: number }[];
  metodos: { metodo: string; total: number }[];
  usuarios: { usuario: string; total: number }[];
  rangoLabel?: string;
}) {
  function descargarCSV() {
    const linea = (arr: (string | number)[]) =>
      arr.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    const s: string[] = [];
    s.push("REPORTE - El Surtidor", rangoLabel, "");
    s.push("Ventas diarias", linea(["Día", "Total (Bs)"]));
    diarias.forEach((d) => s.push(linea([d.dia, d.total])));
    s.push("", "Top productos", linea(["Producto", "Unidades"]));
    topProductos.forEach((p) => s.push(linea([p.nombre, p.cantidad])));
    s.push("", "Ventas por categoría", linea(["Categoría", "Total (Bs)"]));
    categorias.forEach((c) => s.push(linea([c.categoria, c.total])));
    s.push("", "Métodos de pago", linea(["Método", "Total (Bs)"]));
    metodos.forEach((m) => s.push(linea([m.metodo, m.total])));
    s.push("", "Ventas por cajero", linea(["Cajero", "Total (Bs)"]));
    usuarios.forEach((u) => s.push(linea([u.usuario, u.total])));
    const blob = new Blob(["﻿" + s.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_minimarket_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end gap-2">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Printer className="h-4 w-4" /> Exportar PDF
        </button>
        <button
          onClick={descargarCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" /> Exportar Excel
        </button>
      </div>

      <ChartCard title="Ventas diarias" subtitle={`${rangoLabel} (Bs)`}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={diarias} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip formatter={(v) => [formatBs(Number(v)), "Ventas"]} contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2.5} fill="url(#repFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top 8 productos" subtitle="Unidades vendidas">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProductos} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11, fill: "#475569" }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip formatter={(v) => [`${Number(v)} u.`, "Vendidas"]} contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="cantidad" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ventas por categoría" subtitle="Participación">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={categorias} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={110} paddingAngle={2}>
                {categorias.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatBs(Number(v))} contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: "#475569" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Métodos de pago" subtitle="Monto cobrado">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={metodos} dataKey="total" nameKey="metodo" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {metodos.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatBs(Number(v))} contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "#475569" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ventas por cajero" subtitle="Monto generado">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={usuarios} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="usuario" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v) => [formatBs(Number(v)), "Ventas"]} contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
