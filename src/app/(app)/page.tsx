import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  PieChart as PieIcon,
  Trophy,
  ArrowRight,
  Boxes,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatBs, formatNum, formatFechaHora, cn } from "@/lib/utils";
import { Card, StatCard, Badge, PageHeader } from "@/components/ui";
import { VentasArea, CategoriasPie } from "@/components/dashboard/DashboardCharts";

export const dynamic = "force-dynamic";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default async function DashboardPage() {
  const session = await getSession();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const desde30 = new Date(now.getTime() - 30 * 86400000);
  const desde14 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  const [
    ventasHoy,
    ventasMes,
    totalProductos,
    totalClientes,
    productos,
    ventas14,
    detallesCat,
    topRaw,
    ultimasVentas,
  ] = await Promise.all([
    prisma.venta.aggregate({
      where: { fecha: { gte: startToday }, estado: "COMPLETADA" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venta.aggregate({
      where: { fecha: { gte: startMonth }, estado: "COMPLETADA" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.producto.count({ where: { activo: true } }),
    prisma.cliente.count(),
    prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, stock: true, stockMinimo: true, unidad: true },
    }),
    prisma.venta.findMany({
      where: { fecha: { gte: desde14 }, estado: "COMPLETADA" },
      select: { fecha: true, total: true },
    }),
    prisma.detalleVenta.findMany({
      where: { venta: { fecha: { gte: desde30 }, estado: "COMPLETADA" } },
      select: { subtotal: true, producto: { select: { categoria: { select: { nombre: true } } } } },
    }),
    prisma.detalleVenta.groupBy({
      by: ["productoId"],
      where: { venta: { fecha: { gte: desde30 }, estado: "COMPLETADA" } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 5,
    }),
    prisma.venta.findMany({
      orderBy: { fecha: "desc" },
      take: 6,
      include: { cliente: true, usuario: true, _count: { select: { detalles: true } } },
    }),
  ]);

  // Serie diaria (14 días)
  const buckets = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(desde14.getFullYear(), desde14.getMonth(), desde14.getDate() + i);
    buckets.set(`${d.getDate()}/${d.getMonth() + 1}`, 0);
  }
  for (const v of ventas14) {
    const key = `${v.fecha.getDate()}/${v.fecha.getMonth() + 1}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + v.total);
  }
  const ventasDiarias = Array.from(buckets, ([dia, total]) => ({
    dia,
    total: Math.round(total * 100) / 100,
  }));

  // Ventas por categoría
  const catMap = new Map<string, number>();
  for (const d of detallesCat) {
    const c = d.producto.categoria.nombre;
    catMap.set(c, (catMap.get(c) || 0) + d.subtotal);
  }
  const ventasCategoria = Array.from(catMap, ([categoria, total]) => ({
    categoria,
    total: Math.round(total * 100) / 100,
  })).sort((a, b) => b.total - a.total);

  // Top productos
  const topIds = topRaw.map((t) => t.productoId);
  const topProds = await prisma.producto.findMany({
    where: { id: { in: topIds } },
    select: { id: true, nombre: true },
  });
  const topProductos = topRaw.map((t) => ({
    nombre: topProds.find((p) => p.id === t.productoId)?.nombre ?? "—",
    cantidad: t._sum.cantidad ?? 0,
    total: t._sum.subtotal ?? 0,
  }));
  const maxTop = Math.max(...topProductos.map((t) => t.cantidad), 1);

  // Bajo stock
  const bajoStock = productos
    .filter((p) => p.stock <= p.stockMinimo)
    .sort((a, b) => a.stock - b.stock);

  const ticketPromedio =
    ventasHoy._count > 0 ? (ventasHoy._sum.total ?? 0) / ventasHoy._count : 0;

  return (
    <div>
      <PageHeader
        title={`¡Hola, ${session?.nombre.split(" ")[0]}!`}
        subtitle={`Resumen de hoy · ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`}
        icon={TrendingUp}
      >
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <ShoppingBag className="h-4 w-4" />
          Nueva venta
        </Link>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas de hoy"
          value={formatBs(ventasHoy._sum.total ?? 0)}
          hint={`${ventasHoy._count} transacciones · ticket ${formatBs(ticketPromedio)}`}
          icon={DollarSign}
          color="brand"
        />
        <StatCard
          title="Ventas del mes"
          value={formatBs(ventasMes._sum.total ?? 0)}
          hint={`${ventasMes._count} ventas en ${MESES[now.getMonth()]}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Productos activos"
          value={formatNum(totalProductos)}
          hint={`${totalClientes} clientes registrados`}
          icon={Package}
          color="violet"
        />
        <StatCard
          title="Bajo stock"
          value={formatNum(bajoStock.length)}
          hint="Productos que requieren reposición"
          icon={AlertTriangle}
          color={bajoStock.length > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Tendencia de ventas</h2>
              <p className="text-xs text-slate-400">Últimos 14 días</p>
            </div>
            <Badge color="brand">
              <TrendingUp className="h-3 w-3" /> En vivo
            </Badge>
          </div>
          <VentasArea data={ventasDiarias} />
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-brand-600" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Ventas por categoría</h2>
              <p className="text-xs text-slate-400">Últimos 30 días</p>
            </div>
          </div>
          <CategoriasPie data={ventasCategoria} />
        </Card>
      </div>

      {/* Top productos + bajo stock + últimas ventas */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top productos */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Productos más vendidos</h2>
          </div>
          <div className="space-y-3">
            {topProductos.map((p, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {i + 1}. {p.nombre}
                  </span>
                  <span className="text-slate-500">{p.cantidad} u.</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: `${(p.cantidad / maxTop) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bajo stock */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Alertas de stock</h2>
            </div>
            <Link href="/inventario" className="text-xs font-medium text-brand-600 hover:underline">
              Ver todo
            </Link>
          </div>
          {bajoStock.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Boxes className="h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-slate-500">Todo el stock está en orden.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bajoStock.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 px-3 py-2"
                >
                  <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {p.nombre}
                  </span>
                  <Badge color={p.stock === 0 ? "red" : "amber"}>
                    {p.stock} / {p.stockMinimo} {p.unidad}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Últimas ventas */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Últimas ventas</h2>
            <Link href="/ventas" className="text-xs font-medium text-brand-600 hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="space-y-2">
            {ultimasVentas.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {v.cliente?.nombre ?? "Consumidor Final"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {v.numero} · {v._count.detalles} ítems · {formatFechaHora(v.fecha)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatBs(v.total)}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/ventas"
            className={cn(
              "mt-4 flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            )}
          >
            Historial completo <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
