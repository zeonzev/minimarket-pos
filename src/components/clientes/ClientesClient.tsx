"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/Modal";
import { formatBs, iniciales } from "@/lib/utils";
import { guardarCliente, eliminarCliente, type ClienteInput } from "@/app/(app)/clientes/actions";

type Cliente = {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  compras: number;
  totalGastado: number;
};

const empty: ClienteInput = { nombre: "", nit: "", telefono: "", email: "", direccion: "" };

export default function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClienteInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clientes.filter(
      (c) => !q || c.nombre.toLowerCase().includes(q) || c.nit.includes(q) || c.telefono.includes(q)
    );
  }, [clientes, query]);

  function nuevo() {
    setForm(empty);
    setError(null);
    setOpen(true);
  }
  function editar(c: Cliente) {
    setForm({ id: c.id, nombre: c.nombre, nit: c.nit, telefono: c.telefono, email: c.email, direccion: c.direccion });
    setError(null);
    setOpen(true);
  }
  function guardar() {
    startTransition(async () => {
      const res = await guardarCliente(form);
      if (res.ok) setOpen(false);
      else setError(res.error ?? "Error");
    });
  }
  function borrar() {
    if (!form.id) return;
    startTransition(async () => {
      const res = await eliminarCliente(form.id!);
      if (res.ok) setOpen(false);
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clientes.length} clientes registrados`} icon={Users}>
        <button
          onClick={nuevo}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Nuevo cliente
        </button>
      </PageHeader>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, NIT o teléfono…"
          className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Sin clientes" subtitle="Agrega tu primer cliente." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 text-center font-medium">Compras</th>
                  <th className="px-4 py-3 text-right font-medium">Total gastado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                          {iniciales(c.nombre)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{c.nombre}</p>
                          {c.nit && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <CreditCard className="h-3 w-3" /> NIT/CI: {c.nit}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="space-y-0.5">
                        {c.telefono && (
                          <p className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" /> {c.telefono}
                          </p>
                        )}
                        {c.email && (
                          <p className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" /> {c.email}
                          </p>
                        )}
                        {!c.telefono && !c.email && <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge color="blue">{c.compras}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                      {formatBs(c.totalGastado)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => editar(c)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
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
        title={form.id ? "Editar cliente" : "Nuevo cliente"}
        size="md"
        footer={
          <>
            {form.id && form.id !== 1 && (
              <button
                onClick={borrar}
                disabled={pending}
                className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            )}
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
        <div className="space-y-4">
          <Field label="Nombre / Razón social">
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIT / CI">
              <input value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Teléfono">
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Correo electrónico">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Dirección">
            <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className={inputClass} />
          </Field>
        </div>
        {error && <p className="mt-4 animate-pop rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </Modal>
    </div>
  );
}
