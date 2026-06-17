"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Loader2,
  PackageSearch,
  Barcode,
} from "lucide-react";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/Modal";
import { formatBs, cn } from "@/lib/utils";
import {
  guardarProducto,
  toggleProductoActivo,
  type ProductoInput,
} from "@/app/(app)/productos/actions";

type Producto = {
  id: number;
  codigo: string;
  nombre: string;
  categoriaId: number;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  unidad: string;
  activo: boolean;
};

const UNIDADES = ["UND", "KG", "LT", "PACK"];
const empty = (catId: number): ProductoInput => ({
  codigo: "",
  nombre: "",
  categoriaId: catId,
  precioCompra: 0,
  precioVenta: 0,
  stock: 0,
  stockMinimo: 5,
  unidad: "UND",
});

export default function ProductosClient({
  productos,
  categorias,
  canEdit,
}: {
  productos: Producto[];
  categorias: { id: number; nombre: string }[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductoInput>(empty(categorias[0]?.id ?? 1));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (cat === 0 || p.categoriaId === cat) &&
        (!q || p.nombre.toLowerCase().includes(q) || p.codigo.includes(q))
    );
  }, [productos, query, cat]);

  function nuevo() {
    setForm(empty(categorias[0]?.id ?? 1));
    setError(null);
    setOpen(true);
  }
  function editar(p: Producto) {
    setForm({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      categoriaId: p.categoriaId,
      precioCompra: p.precioCompra,
      precioVenta: p.precioVenta,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      unidad: p.unidad,
    });
    setError(null);
    setOpen(true);
  }

  function guardar() {
    startTransition(async () => {
      const res = await guardarProducto(form);
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.error ?? "Error");
      }
    });
  }

  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <div>
      <PageHeader title="Productos" subtitle={`${productos.length} productos en catálogo`} icon={Package}>
        {canEdit && (
          <button
            onClick={nuevo}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </button>
        )}
      </PageHeader>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(Number(e.target.value))}
          className="rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value={0}>Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={PackageSearch} title="Sin productos" subtitle="Ajusta la búsqueda o agrega un nuevo producto." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">P. Compra</th>
                  <th className="px-4 py-3 text-right font-medium">P. Venta</th>
                  <th className="px-4 py-3 text-center font-medium">Stock</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  {canEdit && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.map((p) => {
                  const bajo = p.stock <= p.stockMinimo;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-400">
                            <Barcode className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{p.nombre}</p>
                            <p className="font-mono text-xs text-slate-400">{p.codigo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.categoria}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{formatBs(p.precioCompra)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">{formatBs(p.precioVenta)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-14 justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                            p.stock === 0
                              ? "bg-red-100 text-red-600"
                              : bajo
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {p.stock} {p.unidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.activo ? <Badge color="green">Activo</Badge> : <Badge color="slate">Inactivo</Badge>}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => editar(p)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Editar producto" : "Nuevo producto"}
        subtitle="Completa la información del producto"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código de barras" className="col-span-1">
            <input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className={inputClass}
              placeholder="7790000000000"
            />
          </Field>
          <Field label="Unidad" className="col-span-1">
            <select
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
              className={inputClass}
            >
              {UNIDADES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Nombre del producto" className="col-span-2">
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClass}
              placeholder="Ej. Coca-Cola 2L"
            />
          </Field>
          <Field label="Categoría" className="col-span-2">
            <select
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: Number(e.target.value) })}
              className={inputClass}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Precio de compra (Bs)">
            <input
              type="number"
              step="0.01"
              value={form.precioCompra || ""}
              onChange={(e) => setForm({ ...form, precioCompra: num(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Precio de venta (Bs)">
            <input
              type="number"
              step="0.01"
              value={form.precioVenta || ""}
              onChange={(e) => setForm({ ...form, precioVenta: num(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Stock actual">
            <input
              type="number"
              value={form.stock || ""}
              onChange={(e) => setForm({ ...form, stock: num(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Stock mínimo">
            <input
              type="number"
              value={form.stockMinimo || ""}
              onChange={(e) => setForm({ ...form, stockMinimo: num(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>
        {error && (
          <p className="mt-4 animate-pop rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {form.id && (
          <button
            onClick={() =>
              startTransition(async () => {
                await toggleProductoActivo(form.id!);
                setOpen(false);
              })
            }
            className="mt-4 text-sm font-medium text-slate-400 hover:text-red-500"
          >
            Activar / desactivar producto
          </button>
        )}
      </Modal>
    </div>
  );
}
