"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatBs } from "@/lib/utils";

const PIE_COLORS = [
  "#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b",
  "#ef4444", "#10b981", "#ec4899", "#64748b",
];

export function VentasArea({
  data,
}: {
  data: { dia: string; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="ventasFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          formatter={(v) => [formatBs(Number(v)), "Ventas"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#0d9488"
          strokeWidth={2.5}
          fill="url(#ventasFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoriasPie({
  data,
}: {
  data: { categoria: string; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoria"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => formatBs(Number(v))}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            fontSize: 13,
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => <span style={{ color: "#475569" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
