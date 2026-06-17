"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Boxes,
  Search,
  Loader2,
  SlidersHorizontal,
  Wallet,
  AlertTriangle,
  PackageX,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";
import { PageHeader, Card, StatCard, Badge, EmptyState } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/Modal";
import { formatBs, formatNum, formatFechaHora, cn } from "@/lib/utils";
import { ajustarStock } from "@/app/(app)/inventario/actions";

type Producto = {
  id: number;
  nombre: string;
  codigo: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  unidad: string;
  precioCompra: number;
};
type Mov = {
  id: number;
  producto: string;
  unidad: string;
  tipo: string;
  cantidad: number;
  stockResultante: number;
  motivo: string;
  fecha: string;
};

const estadoDe = (p: Producto) =>
  p.stock === 0 ? "Agotado" : p.stock <= p.stockMinimo ? "Bajo" : "Óptimo";

export default function InventarioClient({
  productos,
  movimientos,
}: {
  productos: Producto[];
  movimientos: Mov[];
}) {
  const [tab, setTab] = useState<"existencias" | "kardex">("existencias");
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [sel, setSel] = useState<Producto | null>(null);
  const [nuevoStock, setNuevoStock] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valorTotal = productos.reduce((s, p) => s + p.stock * p.precioCompra, 0);
  const unidades = productos.reduce((s, p) => s + p.stock, 0);
  const bajos = productos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo).length;
  const agotados = productos.filter((p) => p.stock === 0).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const okQ = !q || p.nombre.toLowerCase().includes(q) || p.codigo.includes(q);
      const e = estadoDe(p);
      const okF = filtro === "Todos" || e === filtro;
      return okQ && okF;
    });
  }, [productos, query, filtro]);

  function abrirAjuste(p: Producto) {
    setSel(p);
    setNuevoStock(p.stock);
    setMotivo("");
    setError(null);
  }
  function guardarAjuste() {
    if (!sel) return;
    startTransition(async () => {
      const res = await ajustarStock(sel.id, nuevoStock, motivo);
      if (res.ok) setSel(null);
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div>
      <PageHeader title="Inventario" subtitle="Control de existencias y kardex" icon={Boxes} />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Valor del inventario" value={formatBs(valorTotal)} hint="A precio de costo" icon={Wallet} color="brand" />
        <StatCard title="Unidades en stock" value={formatNum(unidades)} hint={`${productos.length} productos`} icon={Layers} color="blue" />
        <StatCard title="Bajo stock" value={formatNum(bajos)} hint="Requieren reposición" icon={AlertTriangle} color="amber" />
        <StatCard title="Agotados" value={formatNum(agotados)} hint="Sin existencias" icon={PackageX} color={agotados ? "rose" : "emerald"} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          { id: "existencias", label: "Existencias" },
          { id: "kardex", label: "Kardex (movimientos)" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "existencias" ? (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto…"
                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div className="flex gap-2">
              {["Todos", "Óptimo", "Bajo", "Agotado"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition",
                    filtro === f ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState icon={Boxes} title="Sin resultados" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 text-center font-medium">Stock</th>
                      <th className="px-4 py-3 text-center font-medium">Mínimo</th>
                      <th className="px-4 py-3 text-right font-medium">Valorizado</th>
                      <th className="px-4 py-3 text-center font-medium">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filtered.map((p) => {
                      const e = estadoDe(p);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{p.nombre}</p>
                            <p className="font-mono text-xs text-slate-400">{p.codigo}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.categoria}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">
                            {p.stock} {p.unidad}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">{p.stockMinimo}</td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatBs(p.stock * p.precioCompra)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge color={e === "Agotado" ? "red" : e === "Bajo" ? "amber" : "green"}>{e}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => abrirAjuste(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" /> Ajustar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-center font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-center font-medium">Stock final</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {movimientos.map((m) => {
                  const ent = m.tipo === "ENTRADA";
                  const aj = m.tipo === "AJUSTE";
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-500">{formatFechaHora(m.fecha)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{m.producto}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            ent ? "bg-emerald-100 text-emerald-700" : aj ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {ent ? <ArrowDownCircle className="h-3 w-3" /> : aj ? <RefreshCw className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                          {m.tipo}
                        </span>
                      </td>
                      <td className={cn("px-4 py-3 text-center font-semibold", m.cantidad >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {m.cantidad > 0 ? "+" : ""}
                        {m.cantidad}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-200">{m.stockResultante}</td>
                      <td className="px-4 py-3 text-slate-500">{m.motivo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de ajuste */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title="Ajustar existencias"
        subtitle={sel?.nombre}
        size="sm"
        footer={
          <>
            <button onClick={() => setSel(null)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={guardarAjuste}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar ajuste
            </button>
          </>
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">Stock actual</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {sel.stock} {sel.unidad}
              </span>
            </div>
            <Field label="Nuevo stock">
              <input
                type="number"
                min={0}
                value={nuevoStock}
                onChange={(e) => setNuevoStock(Math.max(0, Number(e.target.value) || 0))}
                className={inputClass}
              />
            </Field>
            <Field label="Motivo del ajuste">
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Conteo físico, merma, vencimiento…"
                className={inputClass}
              />
            </Field>
            {nuevoStock !== sel.stock && (
              <p className="text-xs text-slate-500">
                Movimiento:{" "}
                <span className={cn("font-semibold", nuevoStock > sel.stock ? "text-emerald-600" : "text-red-500")}>
                  {nuevoStock > sel.stock ? "+" : ""}
                  {nuevoStock - sel.stock} {sel.unidad}
                </span>
              </p>
            )}
            {error && <p className="animate-pop rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
