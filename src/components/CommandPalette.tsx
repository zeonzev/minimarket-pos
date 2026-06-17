"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Truck,
  Users,
  BarChart3,
  UserCog,
  Database,
  Barcode,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import { cn, formatBs } from "@/lib/utils";
import { buscarGlobal, type ResultadoBusqueda } from "@/app/(app)/buscar/actions";

type Item = {
  label: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  grupo: string;
};

const MODULOS: (Item & { roles?: string[] })[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", grupo: "Ir a" },
  { label: "Punto de Venta", icon: ShoppingCart, href: "/pos", grupo: "Ir a", roles: ["ADMIN", "CAJERO"] },
  { label: "Ventas", icon: Receipt, href: "/ventas", grupo: "Ir a" },
  { label: "Clientes", icon: Users, href: "/clientes", grupo: "Ir a", roles: ["ADMIN", "CAJERO"] },
  { label: "Productos", icon: Package, href: "/productos", grupo: "Ir a" },
  { label: "Inventario", icon: Boxes, href: "/inventario", grupo: "Ir a", roles: ["ADMIN", "ALMACENERO"] },
  { label: "Compras", icon: Truck, href: "/compras", grupo: "Ir a", roles: ["ADMIN", "ALMACENERO"] },
  { label: "Reportes", icon: BarChart3, href: "/reportes", grupo: "Ir a", roles: ["ADMIN"] },
  { label: "Base de Datos", icon: Database, href: "/base-de-datos", grupo: "Ir a", roles: ["ADMIN"] },
  { label: "Usuarios", icon: UserCog, href: "/usuarios", grupo: "Ir a", roles: ["ADMIN"] },
];

export default function CommandPalette({ rol }: { rol: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<ResultadoBusqueda>({ productos: [], clientes: [], ventas: [] });
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setRes({ productos: [], clientes: [], ventas: [] });
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setRes({ productos: [], clientes: [], ventas: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await buscarGlobal(query);
      setRes(r);
      setLoading(false);
      setActive(0);
    }, 220);
    return () => clearTimeout(t);
  }, [query, open]);

  const modulosFiltrados = useMemo(
    () =>
      MODULOS.filter((m) => !m.roles || m.roles.includes(rol)).filter(
        (m) => !query.trim() || m.label.toLowerCase().includes(query.toLowerCase())
      ),
    [query, rol]
  );

  const items: Item[] = useMemo(() => {
    const out: Item[] = [...modulosFiltrados];
    res.productos.forEach((p) =>
      out.push({ label: p.nombre, sub: `${p.codigo} · ${p.stock} ${p.unidad}`, icon: Barcode, href: "/productos", grupo: "Productos" })
    );
    res.clientes.forEach((c) =>
      out.push({ label: c.nombre, sub: c.nit ? `NIT/CI: ${c.nit}` : "Cliente", icon: Users, href: "/clientes", grupo: "Clientes" })
    );
    res.ventas.forEach((v) =>
      out.push({ label: v.numero, sub: `${v.cliente} · ${formatBs(v.total)}`, icon: Receipt, href: "/ventas", grupo: "Ventas" })
    );
    return out;
  }, [modulosFiltrados, res]);

  function go(item?: Item) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    }
  }

  if (!open) return null;

  // Agrupar para render
  let runningIndex = -1;
  const grupos = ["Ir a", "Productos", "Clientes", "Ventas"];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar productos, clientes, ventas o ir a un módulo…"
            className="flex-1 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block dark:border-slate-600">ESC</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              {query.trim().length < 2 ? "Escribe para buscar… (atajo Ctrl + K)" : "Sin resultados."}
            </p>
          ) : (
            grupos.map((g) => {
              const delGrupo = items.filter((it) => it.grupo === g);
              if (delGrupo.length === 0) return null;
              return (
                <div key={g} className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g}</p>
                  {delGrupo.map((it) => {
                    runningIndex++;
                    const idx = runningIndex;
                    return (
                      <button
                        key={g + idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(it)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                          active === idx ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        <it.icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="flex-1 truncate">
                          {it.label}
                          {it.sub && <span className="ml-2 text-xs text-slate-400">{it.sub}</span>}
                        </span>
                        {active === idx && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
