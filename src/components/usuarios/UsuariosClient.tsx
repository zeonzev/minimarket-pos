"use client";

import { useState, useTransition } from "react";
import { UserCog, Plus, Pencil, Loader2, ShieldCheck, ShoppingCart, Boxes } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/Modal";
import { iniciales, formatFechaHora, cn } from "@/lib/utils";
import { guardarUsuario, toggleUsuario, type UsuarioInput } from "@/app/(app)/usuarios/actions";

type Usuario = {
  id: number;
  nombre: string;
  usuario: string;
  email: string;
  rolId: number;
  rol: string;
  activo: boolean;
  ventas: number;
  ultimoAcceso: string | null;
};
type Rol = { id: number; nombre: string; descripcion: string };

const ROL_META: Record<string, { color: "violet" | "blue" | "amber"; icon: React.ComponentType<{ className?: string }> }> = {
  ADMIN: { color: "violet", icon: ShieldCheck },
  CAJERO: { color: "blue", icon: ShoppingCart },
  ALMACENERO: { color: "amber", icon: Boxes },
};

export default function UsuariosClient({
  usuarios,
  roles,
  currentUserId,
}: {
  usuarios: Usuario[];
  roles: Rol[];
  currentUserId: number;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UsuarioInput>({
    nombre: "",
    usuario: "",
    email: "",
    rolId: roles[0]?.id ?? 1,
    password: "",
    activo: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function nuevo() {
    setForm({ nombre: "", usuario: "", email: "", rolId: roles[0]?.id ?? 1, password: "", activo: true });
    setError(null);
    setOpen(true);
  }
  function editar(u: Usuario) {
    setForm({ id: u.id, nombre: u.nombre, usuario: u.usuario, email: u.email, rolId: u.rolId, password: "", activo: u.activo });
    setError(null);
    setOpen(true);
  }
  function guardar() {
    startTransition(async () => {
      const res = await guardarUsuario(form);
      if (res.ok) setOpen(false);
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div>
      <PageHeader title="Usuarios y roles" subtitle="Gestión de accesos al sistema (RBAC)" icon={UserCog}>
        <button
          onClick={nuevo}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </button>
      </PageHeader>

      {/* Roles */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {roles.map((r) => {
          const meta = ROL_META[r.nombre] ?? ROL_META.CAJERO;
          const count = usuarios.filter((u) => u.rolId === r.id).length;
          return (
            <Card key={r.id} className="flex items-start gap-3 p-4">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl",
                meta.color === "violet" ? "bg-violet-50 text-violet-600" : meta.color === "blue" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
                <meta.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{r.nombre}</p>
                <p className="text-xs text-slate-400">{r.descripcion}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{count} usuario(s)</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {usuarios.length === 0 ? (
          <EmptyState icon={UserCog} title="Sin usuarios" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 text-center font-medium">Ventas</th>
                  <th className="px-4 py-3 font-medium">Último acceso</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {usuarios.map((u) => {
                  const meta = ROL_META[u.rol] ?? ROL_META.CAJERO;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                            {iniciales(u.nombre)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {u.nombre}
                              {u.id === currentUserId && <span className="ml-2 text-xs text-brand-600">(tú)</span>}
                            </p>
                            <p className="text-xs text-slate-400">@{u.usuario} · {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={meta.color}>
                          <meta.icon className="h-3 w-3" /> {u.rol}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{u.ventas}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.ultimoAcceso ? formatFechaHora(u.ultimoAcceso) : "Nunca"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.activo ? <Badge color="green">Activo</Badge> : <Badge color="slate">Inactivo</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => editar(u)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Pencil className="h-4 w-4" />
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Editar usuario" : "Nuevo usuario"}
        size="md"
        footer={
          <>
            {form.id && form.id !== currentUserId && (
              <button
                onClick={() =>
                  startTransition(async () => {
                    const r = await toggleUsuario(form.id!);
                    if (r.ok) setOpen(false);
                    else setError(r.error ?? "Error");
                  })
                }
                disabled={pending}
                className="mr-auto rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-200"
              >
                Activar / desactivar
              </button>
            )}
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
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
          <Field label="Nombre completo">
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Usuario">
              <input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} className={inputClass} placeholder="ej. cajero2" />
            </Field>
            <Field label="Rol">
              <select value={form.rolId} onChange={(e) => setForm({ ...form, rolId: Number(e.target.value) })} className={inputClass}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Correo electrónico">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </Field>
          <Field label={form.id ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="••••••"
            />
          </Field>
        </div>
        {error && <p className="mt-4 animate-pop rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </Modal>
    </div>
  );
}
