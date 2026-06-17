"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";
import {
  Store,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  ShoppingCart,
  BarChart3,
  Boxes,
} from "lucide-react";

const initialState: LoginState = {};

const demoUsers = [
  { rol: "Administrador", usuario: "admin", pass: "admin123" },
  { rol: "Cajero", usuario: "cajero", pass: "cajero123" },
  { rol: "Almacenero", usuario: "almacen", pass: "almacen123" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPass, setShowPass] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-12 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,.4) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.25) 0, transparent 35%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Store className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">El Surtidor</p>
            <p className="text-xs text-brand-100">Sistema de Gestión</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Gestiona tu minimarket de principio a fin.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Punto de venta, control de inventario, compras, clientes y reportes
            en tiempo real. Todo en una sola plataforma.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              { icon: ShoppingCart, t: "Punto de venta ágil", d: "Cobra en segundos con búsqueda por código o nombre." },
              { icon: Boxes, t: "Inventario inteligente", d: "Kardex automático y alertas de stock mínimo." },
              { icon: BarChart3, t: "Reportes en vivo", d: "Decisiones basadas en datos reales del negocio." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.t}</p>
                  <p className="text-sm text-brand-100">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-200">
          UNIFRANZ · Ingeniería en Sistemas · Gestión 2026
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">El Surtidor</p>
              <p className="text-xs text-slate-500">Sistema de Gestión</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa tus credenciales para acceder al panel.
          </p>

          <form action={formAction} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Usuario
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  name="usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {state.error && (
              <div className="animate-pop rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Verificando..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Accesos de demostración */}
          <div className="mt-8">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
              Cuentas de demostración
            </p>
            <div className="grid gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.usuario}
                  type="button"
                  onClick={() => {
                    setUsuario(u.usuario);
                    setPassword(u.pass);
                  }}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="font-medium text-slate-700">{u.rol}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {u.usuario} / {u.pass}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
