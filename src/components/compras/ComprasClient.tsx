"use client";

import { useState, useTransition } from "react";
import {
  Truck,
  Plus,
  Loader2,
  Trash2,
  PackagePlus,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/Modal";
import { formatBs, formatFechaHora } from "@/lib/utils";
import { registrarCompra, type ItemCompra } from "@/app/(app)/compras/actions";

type Compra = {
  id: number;
  numero: string;
  proveedor: string;
  usuario: string;
  items: number;
  total: number;
  estado: string;
  fecha: string;
};
type Prod = { id: number; nombre: string; precioCompra: number; unidad: string; stock: number };

type Linea = ItemCompra & { key: number };

export default function ComprasClient({
  compras,
  proveedores,
  productos,
}: {
  compras: Compra[];
  proveedores: { id: number; nombre: string }[];
  productos: Prod[];
}) {
  const [open, setOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState(proveedores[0]?.id ?? 0);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [prodSel, setProdSel] = useState(productos[0]?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setProveedorId(proveedores[0]?.id ?? 0);
    setLineas([]);
    setError(null);
    setOkMsg(null);
    setOpen(true);
  }

  function agregarLinea() {
    const p = productos.find((x) => x.id === prodSel);
    if (!p) return;
    if (lineas.some((l) => l.productoId === p.id)) return;
    setLineas((prev) => [
      ...prev,
      { key: Date.now(), productoId: p.id, cantidad: 1, costoUnitario: p.precioCompra },
    ]);
  }

  function actualizar(key: number, campo: "cantidad" | "costoUnitario", valor: number) {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [campo]: Math.max(0, valor) } : l))
    );
  }
  function quitar(key: number) {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  }

  const total = lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0);
  const nombreProd = (id: number) => productos.find((p) => p.id === id)?.nombre ?? "";
  const unidadProd = (id: number) => productos.find((p) => p.id === id)?.unidad ?? "";

  function registrar() {
    startTransition(async () => {
      const res = await registrarCompra({
        proveedorId,
        items: lineas.map(({ productoId, cantidad, costoUnitario }) => ({
          productoId,
          cantidad,
          costoUnitario,
        })),
      });
      if (res.ok) {
        setOkMsg(`Compra ${res.numero} registrada. Stock actualizado.`);
        setLineas([]);
      } else {
        setError(res.error ?? "Error");
      }
    });
  }

  return (
    <div>
      <PageHeader title="Compras" subtitle="Abastecimiento y órdenes a proveedores" icon={Truck}>
        <button
          onClick={abrir}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Nueva compra
        </button>
      </PageHeader>

      <Card className="overflow-hidden">
        {compras.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Sin compras registradas" subtitle="Registra tu primera compra a proveedor." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Registrado por</th>
                  <th className="px-4 py-3 text-center font-medium">Ítems</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {compras.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-200">{c.numero}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{c.proveedor}</td>
                    <td className="px-4 py-3 text-slate-500">{c.usuario}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{c.items}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">{formatBs(c.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge color="green">{c.estado}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatFechaHora(c.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva compra"
        subtitle="Registra el ingreso de mercadería"
        size="xl"
        footer={
          <>
            <div className="mr-auto text-sm text-slate-500">
              Total:{" "}
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatBs(total)}</span>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cerrar
            </button>
            <button
              onClick={registrar}
              disabled={pending || lineas.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Registrar compra
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Proveedor">
              <select value={proveedorId} onChange={(e) => setProveedorId(Number(e.target.value))} className={inputClass}>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <Field label="Agregar producto" className="flex-1">
                <select value={prodSel} onChange={(e) => setProdSel(Number(e.target.value))} className={inputClass}>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                onClick={agregarLinea}
                className="mb-0.5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                <PackagePlus className="h-4 w-4" /> Añadir
              </button>
            </div>
          </div>

          {/* Líneas */}
          {lineas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center text-sm text-slate-400">
              Agrega productos a la orden de compra.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left dark:bg-slate-900/40 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 text-center font-medium">Cantidad</th>
                    <th className="px-3 py-2 text-center font-medium">Costo unit.</th>
                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {lineas.map((l) => (
                    <tr key={l.key}>
                      <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">
                        {nombreProd(l.productoId)}{" "}
                        <span className="text-xs text-slate-400">({unidadProd(l.productoId)})</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={l.cantidad}
                          onChange={(e) => actualizar(l.key, "cantidad", Number(e.target.value) || 0)}
                          className="w-20 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-center outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={l.costoUnitario}
                          onChange={(e) => actualizar(l.key, "costoUnitario", Number(e.target.value) || 0)}
                          className="w-24 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-center outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatBs(l.cantidad * l.costoUnitario)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => quitar(l.key)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="animate-pop rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {okMsg && (
            <p className="flex animate-pop items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {okMsg}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
