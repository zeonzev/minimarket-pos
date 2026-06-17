"use client";

import { useState } from "react";
import { Database, Table2, KeyRound, Link2, Boxes } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type TablaPreview = {
  nombre: string;
  registros: number;
  columnas: string[];
  filas: (string | number)[][];
};

/* ----------------------- Diagrama ER (SVG) ----------------------- */
type Ent = { id: string; t: string; x: number; y: number; f: string[] };
const W = 210;
const WR = 232;
const ents: Ent[] = [
  { id: "rol", t: "Rol", x: 20, y: 24, f: ["id PK", "nombre", "descripcion"] },
  { id: "usuario", t: "Usuario", x: 370, y: 14, f: ["id PK", "nombre", "usuario", "rolId FK", "passwordHash"] },
  { id: "categoria", t: "Categoria", x: 20, y: 168, f: ["id PK", "nombre", "descripcion"] },
  { id: "producto", t: "Producto", x: 370, y: 184, f: ["id PK", "codigo", "nombre", "categoriaId FK", "precioVenta", "stock"] },
  { id: "proveedor", t: "Proveedor", x: 20, y: 320, f: ["id PK", "nombre", "nit", "telefono"] },
  { id: "compra", t: "Compra", x: 370, y: 360, f: ["id PK", "numero", "proveedorId FK", "usuarioId FK", "total"] },
  { id: "cliente", t: "Cliente", x: 20, y: 470, f: ["id PK", "nombre", "nit", "telefono"] },
  { id: "venta", t: "Venta", x: 370, y: 500, f: ["id PK", "numero", "clienteId FK", "usuarioId FK", "total", "metodoPago"] },
  { id: "movimiento", t: "MovimientoInventario", x: 720, y: 184, f: ["id PK", "productoId FK", "tipo", "cantidad", "stockResultante"] },
  { id: "detalleCompra", t: "DetalleCompra", x: 720, y: 360, f: ["id PK", "compraId FK", "productoId FK", "cantidad", "costoUnitario"] },
  { id: "detalleVenta", t: "DetalleVenta", x: 720, y: 500, f: ["id PK", "ventaId FK", "productoId FK", "cantidad", "precioUnitario"] },
];
const rels: [string, string][] = [
  ["rol", "usuario"],
  ["categoria", "producto"],
  ["proveedor", "compra"],
  ["cliente", "venta"],
  ["usuario", "venta"],
  ["usuario", "compra"],
  ["producto", "movimiento"],
  ["producto", "detalleCompra"],
  ["compra", "detalleCompra"],
  ["producto", "detalleVenta"],
  ["venta", "detalleVenta"],
];
const wOf = (e: Ent) => (e.x >= 720 ? WR : W);
const hOf = (e: Ent) => 26 + e.f.length * 16 + 8;
const center = (e: Ent) => ({ cx: e.x + wOf(e) / 2, cy: e.y + hOf(e) / 2 });

function ERDiagram() {
  const byId = Object.fromEntries(ents.map((e) => [e.id, e]));
  return (
    <svg viewBox="0 0 972 632" className="h-auto w-full text-slate-700 dark:text-slate-200" style={{ minWidth: 720 }}>
      {/* relaciones (detrás) */}
      {rels.map(([a, b], i) => {
        const A = center(byId[a]);
        const B = center(byId[b]);
        const mx = (A.cx + B.cx) / 2;
        const my = (A.cy + B.cy) / 2;
        return (
          <g key={i}>
            <line x1={A.cx} y1={A.cy} x2={B.cx} y2={B.cy} stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="4 3" />
            <g>
              <rect x={mx - 14} y={my - 9} width={28} height={18} rx={5} fill="#0d9488" />
              <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={600}>
                1:N
              </text>
            </g>
          </g>
        );
      })}
      {/* entidades */}
      {ents.map((e) => {
        const w = wOf(e);
        const h = hOf(e);
        return (
          <g key={e.id}>
            <rect x={e.x} y={e.y} width={w} height={h} rx={10} fill="rgba(13,148,136,0.06)" stroke="#0d9488" strokeWidth={1.4} />
            <path d={`M${e.x},${e.y + 12} a10,10 0 0 1 10,-10 h${w - 20} a10,10 0 0 1 10,10 v14 h-${w} z`} fill="#0d9488" />
            <text x={e.x + 12} y={e.y + 18} fontSize={12.5} fontWeight={700} fill="#fff">
              {e.t}
            </text>
            {e.f.map((f, i) => {
              const isKey = f.includes("PK") || f.includes("FK");
              return (
                <text key={i} x={e.x + 12} y={e.y + 42 + i * 16} fontSize={11} fill="currentColor" fontWeight={isKey ? 600 : 400} opacity={isKey ? 1 : 0.85}>
                  {f}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ----------------------- Página ----------------------- */
export default function BaseDatosClient({
  tablas,
  motor,
}: {
  tablas: TablaPreview[];
  motor: { entidades: number; registros: number };
}) {
  const [activa, setActiva] = useState(tablas[0]?.nombre ?? "");
  const tabla = tablas.find((t) => t.nombre === activa) ?? tablas[0];

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Motor", v: "SQLite", s: "vía Prisma ORM", icon: Database },
          { l: "Entidades / Tablas", v: String(motor.entidades), s: "modelo relacional", icon: Table2 },
          { l: "Registros totales", v: motor.registros.toLocaleString("en-US"), s: "en toda la BD", icon: Boxes },
          { l: "Integridad", v: "FK + Tx", s: "claves foráneas", icon: Link2 },
        ].map((k) => (
          <Card key={k.l} className="p-4">
            <div className="mb-2 flex items-center gap-2 text-brand-600">
              <k.icon className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{k.l}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{k.v}</p>
            <p className="text-xs text-slate-400">{k.s}</p>
          </Card>
        ))}
      </div>

      {/* Diagrama ER */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Modelo Entidad–Relación</h2>
            <p className="text-xs text-slate-400">11 entidades · claves primarias (PK) y foráneas (FK)</p>
          </div>
          <Badge color="brand">
            <KeyRound className="h-3 w-3" /> Esquema
          </Badge>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
          <ERDiagram />
        </div>
      </Card>

      {/* Explorador de tablas */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Explorador de datos</h2>
          <p className="text-xs text-slate-400">Vista en vivo de los registros de cada tabla</p>
        </div>

        {/* Tabs de tablas */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          {tablas.map((t) => (
            <button
              key={t.nombre}
              onClick={() => setActiva(t.nombre)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                activa === t.nombre
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              )}
            >
              {t.nombre}
              <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]", activa === t.nombre ? "bg-white/20" : "bg-slate-200 dark:bg-slate-600")}>
                {t.registros}
              </span>
            </button>
          ))}
        </div>

        {/* Tabla */}
        {tabla && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-900/40">
                  {tabla.columnas.map((c) => (
                    <th key={c} className="px-4 py-2.5 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {tabla.filas.map((fila, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    {fila.map((celda, j) => (
                      <td key={j} className="whitespace-nowrap px-4 py-2.5 text-slate-700 dark:text-slate-200">
                        {String(celda)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-slate-400">
              Mostrando {tabla.filas.length} de {tabla.registros} registros · Para edición completa abre Prisma Studio
              (<span className="font-mono">VER_BASE_DE_DATOS.bat</span> → localhost:5555)
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
