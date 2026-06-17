"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Receipt,
  Search,
  Eye,
  Banknote,
  QrCode,
  CreditCard,
  Ban,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { PageHeader, Card, Badge, StatCard, EmptyState } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { formatBs, formatFechaHora, cn } from "@/lib/utils";
import { anularVenta } from "@/app/(app)/ventas/actions";

type Item = { nombre: string; cantidad: number; precioUnitario: number; subtotal: number };
type Venta = {
  id: number;
  numero: string;
  cliente: string;
  usuario: string;
  total: number;
  subtotal: number;
  descuento: number;
  metodoPago: string;
  montoRecibido: number;
  cambio: number;
  estado: string;
  fecha: string;
  items: Item[];
};

const METODO_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  EFECTIVO: Banknote,
  QR: QrCode,
  TARJETA: CreditCard,
};

export default function VentasClient({
  ventas,
  canAnular,
}: {
  ventas: Venta[];
  canAnular: boolean;
}) {
  const [query, setQuery] = useState("");
  const [metodo, setMetodo] = useState("Todos");
  const [sel, setSel] = useState<Venta | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ventas.filter((v) => {
      const okQ = !q || v.numero.toLowerCase().includes(q) || v.cliente.toLowerCase().includes(q);
      const okM = metodo === "Todos" || v.metodoPago === metodo;
      return okQ && okM;
    });
  }, [ventas, query, metodo]);

  const totalVendido = filtered
    .filter((v) => v.estado !== "ANULADA")
    .reduce((s, v) => s + v.total, 0);
  const completadas = filtered.filter((v) => v.estado !== "ANULADA").length;

  function anular(v: Venta) {
    startTransition(async () => {
      const res = await anularVenta(v.id);
      if (res.ok) setSel(null);
    });
  }

  return (
    <div>
      <PageHeader title="Ventas" subtitle="Historial de transacciones del punto de venta" icon={Receipt} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Ventas mostradas" value={String(completadas)} hint="Transacciones completadas" icon={ShoppingBag} color="brand" />
        <StatCard title="Monto total" value={formatBs(totalVendido)} hint="Suma de ventas filtradas" icon={Receipt} color="blue" />
        <StatCard title="Ticket promedio" value={formatBs(completadas ? totalVendido / completadas : 0)} hint="Por transacción" icon={CreditCard} color="violet" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por N° de venta o cliente…"
            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex gap-2">
          {["Todos", "EFECTIVO", "QR", "TARJETA"].map((m) => (
            <button
              key={m}
              onClick={() => setMetodo(m)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition",
                metodo === m ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {m === "Todos" ? "Todos" : m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="Sin ventas" subtitle="No hay ventas que coincidan con el filtro." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Cajero</th>
                  <th className="px-4 py-3 text-center font-medium">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.map((v) => {
                  const Icon = METODO_ICON[v.metodoPago] ?? Banknote;
                  const anulada = v.estado === "ANULADA";
                  return (
                    <tr key={v.id} className={cn("hover:bg-slate-50/60 dark:hover:bg-slate-700/30", anulada && "opacity-60")}>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-200">{v.numero}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{v.cliente}</td>
                      <td className="px-4 py-3 text-slate-500">{v.usuario}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center justify-center gap-1 text-xs text-slate-500">
                          <Icon className="h-3.5 w-3.5" /> {v.metodoPago}
                        </span>
                      </td>
                      <td className={cn("px-4 py-3 text-right font-semibold", anulada ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100")}>
                        {formatBs(v.total)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatFechaHora(v.fecha)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={anulada ? "red" : "green"}>{anulada ? "Anulada" : "Completada"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSel(v)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Detalle */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={`Venta ${sel?.numero ?? ""}`}
        subtitle={sel ? `${sel.cliente} · ${formatFechaHora(sel.fecha)}` : ""}
        size="md"
        footer={
          canAnular && sel?.estado !== "ANULADA" ? (
            <button
              onClick={() => sel && anular(sel)}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Anular venta
            </button>
          ) : (
            <button onClick={() => setSel(null)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Cerrar
            </button>
          )
        }
      >
        {sel && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Badge color="slate">{sel.usuario}</Badge>
              <Badge color={sel.estado === "ANULADA" ? "red" : "green"}>{sel.estado}</Badge>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left dark:bg-slate-900/40 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 text-center font-medium">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium">P. Unit</th>
                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {sel.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{it.nombre}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{it.cantidad}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{formatBs(it.precioUnitario)}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800 dark:text-slate-100">{formatBs(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatBs(sel.subtotal)}</span>
              </div>
              {sel.descuento > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Descuento</span>
                  <span>-{formatBs(sel.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <span>Total ({sel.metodoPago})</span>
                <span className="text-brand-700">{formatBs(sel.total)}</span>
              </div>
              {sel.metodoPago === "EFECTIVO" && sel.montoRecibido > 0 && (
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Recibido {formatBs(sel.montoRecibido)}</span>
                  <span>Cambio {formatBs(sel.cambio)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
