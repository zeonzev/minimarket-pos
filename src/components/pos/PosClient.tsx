"use client";

import { useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Printer,
  Banknote,
  QrCode,
  CreditCard,
  User,
  Loader2,
  PackageX,
  ScanLine,
  Receipt,
} from "lucide-react";
import { formatBs, cn } from "@/lib/utils";
import { registrarVenta, type RegistrarVentaResult } from "@/app/(app)/pos/actions";

type Producto = {
  id: number;
  codigo: string;
  nombre: string;
  precioVenta: number;
  stock: number;
  unidad: string;
  categoria: string;
};

type CartItem = { producto: Producto; cantidad: number };

const METODOS = [
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { id: "QR", label: "QR", icon: QrCode },
  { id: "TARJETA", label: "Tarjeta", icon: CreditCard },
];

export default function PosClient({
  productos,
  categorias,
  clientes,
}: {
  productos: Producto[];
  categorias: string[];
  clientes: { id: number; nombre: string }[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Todas");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteId, setClienteId] = useState<number>(clientes[0]?.id ?? 0);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [descuento, setDescuento] = useState(0);
  const [recibido, setRecibido] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recibo, setRecibo] = useState<RegistrarVentaResult | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Stock disponible considerando lo que ya está en el carrito
  const enCarrito = (id: number) => cart.find((c) => c.producto.id === id)?.cantidad ?? 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const okCat = cat === "Todas" || p.categoria === cat;
      const okQ =
        !q || p.nombre.toLowerCase().includes(q) || p.codigo.includes(q);
      return okCat && okQ;
    });
  }, [productos, query, cat]);

  function addToCart(p: Producto) {
    if (p.stock <= 0) return;
    setError(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.producto.id === p.id);
      if (existing) {
        if (existing.cantidad >= p.stock) return prev;
        return prev.map((c) =>
          c.producto.id === p.id ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      return [...prev, { producto: p, cantidad: 1 }];
    });
  }

  function setQty(id: number, qty: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.producto.id !== id) return c;
          const capped = Math.max(0, Math.min(qty, c.producto.stock));
          return { ...c, cantidad: capped };
        })
        .filter((c) => c.cantidad > 0)
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((c) => c.producto.id !== id));
  }

  function onSearchEnter(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    const q = query.trim();
    if (!q) return;
    // Coincidencia exacta por código de barras
    const exact = productos.find((p) => p.codigo === q);
    if (exact) {
      addToCart(exact);
      setQuery("");
      return;
    }
    if (filtered.length === 1) {
      addToCart(filtered[0]);
      setQuery("");
    }
  }

  const subtotal = cart.reduce((s, c) => s + c.producto.precioVenta * c.cantidad, 0);
  const total = Math.max(0, subtotal - descuento);
  const cambio = metodoPago === "EFECTIVO" ? Math.max(0, recibido - total) : 0;

  async function cobrar() {
    if (cart.length === 0) return;
    setProcessing(true);
    setError(null);
    const res = await registrarVenta({
      items: cart.map((c) => ({ productoId: c.producto.id, cantidad: c.cantidad })),
      clienteId: clienteId || null,
      metodoPago,
      descuento,
      montoRecibido: metodoPago === "EFECTIVO" ? recibido : total,
    });
    setProcessing(false);
    if (res.ok) {
      setRecibo(res);
      setCart([]);
      setDescuento(0);
      setRecibido(0);
      setMetodoPago("EFECTIVO");
    } else {
      setError(res.error);
    }
  }

  function nuevaVenta() {
    setRecibo(null);
    searchRef.current?.focus();
  }

  function imprimirRecibo() {
    document.body.classList.add("printing-receipt");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-receipt"), 400);
  }

  return (
    <div className="grid h-[calc(100dvh-7rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
      {/* ---------------- Catálogo ---------------- */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchEnter}
              autoFocus
              placeholder="Escanear código o buscar producto…  (Enter para agregar)"
              className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="mb-3 flex flex-wrap gap-2">
          {["Todas", ...categorias].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                cat === c
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="grid place-items-center py-20 text-center text-slate-400">
              <PackageX className="h-10 w-10" />
              <p className="mt-2 text-sm">Sin resultados para “{query}”.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const disp = p.stock - enCarrito(p.id);
                const agotado = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={agotado || disp <= 0}
                    className={cn(
                      "group flex flex-col rounded-xl border bg-white dark:bg-slate-800 p-3 text-left transition",
                      agotado || disp <= 0
                        ? "cursor-not-allowed border-slate-100 dark:border-slate-700 opacity-50"
                        : "border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:shadow-md"
                    )}
                  >
                    <div className="mb-2 grid h-16 place-items-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 text-2xl">
                      <span className="font-mono text-xs text-slate-400">{p.codigo.slice(-4)}</span>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">
                      {p.nombre}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="font-bold text-brand-700">{formatBs(p.precioVenta)}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          agotado
                            ? "bg-red-100 text-red-600"
                            : p.stock <= 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {agotado ? "Agotado" : `${p.stock} ${p.unidad}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Carrito ---------------- */}
      <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Venta actual</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs font-medium text-slate-400 hover:text-red-500"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Cliente */}
        <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <User className="h-3.5 w-3.5" /> Cliente
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Items */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center px-4 text-center text-slate-400">
              <div>
                <ShoppingCart className="mx-auto h-10 w-10" />
                <p className="mt-2 text-sm">Agrega productos para iniciar la venta.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {cart.map((c) => (
                <div
                  key={c.producto.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {c.producto.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatBs(c.producto.precioVenta)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQty(c.producto.id, c.cantidad - 1)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      value={c.cantidad}
                      onChange={(e) => setQty(c.producto.id, Number(e.target.value) || 0)}
                      className="w-9 rounded-md border border-slate-200 dark:border-slate-700 py-1 text-center text-sm outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={() => setQty(c.producto.id, c.cantidad + 1)}
                      disabled={c.cantidad >= c.producto.stock}
                      className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="w-20 text-right text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatBs(c.producto.precioVenta * c.cantidad)}
                  </div>
                  <button
                    onClick={() => removeItem(c.producto.id)}
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales y pago */}
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
          {/* Método de pago */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {METODOS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetodoPago(m.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition",
                  metodoPago === m.id
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50"
                )}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatBs(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Descuento</span>
              <input
                type="number"
                min={0}
                value={descuento || ""}
                onChange={(e) => setDescuento(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0.00"
                className="w-24 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-right outline-none focus:border-brand-500"
              />
            </div>
            {metodoPago === "EFECTIVO" && (
              <>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Recibido</span>
                  <input
                    type="number"
                    min={0}
                    value={recibido || ""}
                    onChange={(e) => setRecibido(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-24 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-right outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Cambio</span>
                  <span className={cn(cambio > 0 && "font-medium text-emerald-600")}>
                    {formatBs(cambio)}
                  </span>
                </div>
              </>
            )}
            <div className="mt-1 flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <span>Total</span>
              <span className="text-brand-700">{formatBs(total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-2 animate-pop rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={cobrar}
            disabled={cart.length === 0 || processing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {processing ? "Procesando…" : `Cobrar ${formatBs(total)}`}
          </button>
        </div>
      </div>

      {/* ---------------- Modal de recibo ---------------- */}
      {recibo?.ok && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-pop rounded-2xl bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex flex-col items-center border-b border-slate-100 dark:border-slate-700 px-6 py-5">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">¡Venta registrada!</h3>
              <p className="text-sm text-slate-400">
                {recibo.recibo.numero} · {recibo.recibo.cajero}
              </p>
            </div>

            <div id="recibo-print" className="max-h-64 overflow-y-auto px-6 py-4">
              <div className="mb-2 text-center">
                <p className="font-bold text-slate-800 dark:text-slate-100">El Surtidor</p>
                <p className="text-[11px] text-slate-400">Minimarket · La Paz, Bolivia</p>
              </div>
              <p className="text-xs text-slate-500">Cliente: {recibo.recibo.cliente}</p>
              <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
              <div className="space-y-1">
                {recibo.recibo.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-600">
                      {it.cantidad}× {it.nombre}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">{formatBs(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="my-2 border-t border-dashed border-slate-200 dark:border-slate-700" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatBs(recibo.recibo.subtotal)}</span>
                </div>
                {recibo.recibo.descuento > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Descuento</span>
                    <span>-{formatBs(recibo.recibo.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
                  <span>Total</span>
                  <span>{formatBs(recibo.recibo.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Pago ({recibo.recibo.metodoPago})</span>
                  <span>{formatBs(recibo.recibo.montoRecibido)}</span>
                </div>
                {recibo.recibo.cambio > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Cambio</span>
                    <span>{formatBs(recibo.recibo.cambio)}</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                ¡Gracias por su compra!
              </p>
            </div>

            <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 p-4">
              <button
                onClick={imprimirRecibo}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Printer className="h-4 w-4" /> Imprimir
              </button>
              <button
                onClick={nuevaVenta}
                className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Receipt className="h-4 w-4" /> Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
