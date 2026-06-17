"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  Store,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Search } from "lucide-react";
import { cn, iniciales } from "@/lib/utils";
import { logoutAction } from "@/app/(app)/actions";
import type { SessionUser } from "@/lib/session";
import Assistant from "@/components/Assistant";
import ThemeToggle from "@/components/ThemeToggle";
import CommandPalette from "@/components/CommandPalette";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // si no se indica, visible para todos
};

const NAV: { seccion: string; items: NavItem[] }[] = [
  {
    seccion: "Operación",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pos", label: "Punto de Venta", icon: ShoppingCart, roles: ["ADMIN", "CAJERO"] },
      { href: "/ventas", label: "Ventas", icon: Receipt },
      { href: "/clientes", label: "Clientes", icon: Users, roles: ["ADMIN", "CAJERO"] },
    ],
  },
  {
    seccion: "Almacén",
    items: [
      { href: "/productos", label: "Productos", icon: Package },
      { href: "/inventario", label: "Inventario", icon: Boxes, roles: ["ADMIN", "ALMACENERO"] },
      { href: "/compras", label: "Compras", icon: Truck, roles: ["ADMIN", "ALMACENERO"] },
    ],
  },
  {
    seccion: "Administración",
    items: [
      { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["ADMIN"] },
      { href: "/base-de-datos", label: "Base de Datos", icon: Database, roles: ["ADMIN"] },
      { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
    ],
  },
];

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  CAJERO: "Cajero",
  ALMACENERO: "Almacenero",
};

export default function AppShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const can = (item: NavItem) => !item.roles || item.roles.includes(session.rol);

  const NavLinks = () => (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV.map((grupo) => {
        const visibles = grupo.items.filter(can);
        if (visibles.length === 0) return null;
        return (
          <div key={grupo.seccion}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {grupo.seccion}
            </p>
            <div className="space-y-1">
              {visibles.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-900/40"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const SidebarInner = () => (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold leading-tight text-white">El Surtidor</p>
          <p className="text-[11px] text-slate-400">Sistema de Gestión</p>
        </div>
      </div>
      <NavLinks />
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-300">
            {iniciales(session.nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{session.nombre}</p>
            <p className="truncate text-[11px] text-slate-400">
              {ROL_LABEL[session.rol] ?? session.rol}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarInner />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 animate-fade-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute -right-12 top-4 grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarInner />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-2">
            <button
              onClick={() =>
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar…</span>
              <kbd className="ml-2 hidden rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium md:inline dark:border-slate-600">
                Ctrl K
              </kbd>
            </button>
          </div>

          <ThemeToggle />

          {/* Usuario */}
          <div className="relative">
            <button
              onClick={() => setUserMenu((s) => !s)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {iniciales(session.nombre)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">
                  {session.nombre}
                </p>
                <p className="text-[11px] text-slate-400">
                  {ROL_LABEL[session.rol] ?? session.rol}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {userMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 animate-pop rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{session.nombre}</p>
                    <p className="text-xs text-slate-400">@{session.usuario}</p>
                  </div>
                  <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Búsqueda global (Ctrl+K) y asistente */}
      <CommandPalette rol={session.rol} />
      <Assistant />
    </div>
  );
}
