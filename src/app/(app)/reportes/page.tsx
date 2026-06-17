import { BarChart3, DollarSign, ShoppingBag, Receipt, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/ui";
import { formatBs, formatFecha } from "@/lib/utils";
import ReportesView from "@/components/reportes/ReportesView";
import DateFilter from "@/components/reportes/DateFilter";

export const dynamic = "force-dynamic";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const now = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  let desde: Date;
  let hasta: Date = now;
  let rango = "30";
  let rangoLabel = "Últimos 30 días";

  if (sp.desde && sp.hasta) {
    desde = new Date(sp.desde + "T00:00:00");
    hasta = new Date(sp.hasta + "T23:59:59");
    rango = "custom";
    rangoLabel = `${formatFecha(desde)} – ${formatFecha(hasta)}`;
  } else {
    switch (sp.rango) {
      case "hoy":
        desde = startOf(now);
        rango = "hoy";
        rangoLabel = "Hoy";
        break;
      case "7":
        desde = startOf(new Date(now.getTime() - 6 * 86400000));
        rango = "7";
        rangoLabel = "Últimos 7 días";
        break;
      case "mes":
        desde = new Date(now.getFullYear(), now.getMonth(), 1);
        rango = "mes";
        rangoLabel = "Este mes";
        break;
      default:
        desde = startOf(new Date(now.getTime() - 29 * 86400000));
        rango = "30";
        rangoLabel = "Últimos 30 días";
    }
  }
  const desdeStart = startOf(desde);

  const [ventas, detalles] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: { gte: desde, lte: hasta }, estado: "COMPLETADA" },
      select: { fecha: true, total: true, metodoPago: true, usuario: { select: { nombre: true } } },
    }),
    prisma.detalleVenta.findMany({
      where: { venta: { fecha: { gte: desde, lte: hasta }, estado: "COMPLETADA" } },
      select: {
        cantidad: true,
        subtotal: true,
        producto: { select: { nombre: true, categoria: { select: { nombre: true } } } },
      },
    }),
  ]);

  // Serie diaria (acotada al rango, máx 92 días)
  const dias = Math.min(Math.round((startOf(hasta).getTime() - desdeStart.getTime()) / 86400000) + 1, 92);
  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < dias; i++) {
    const d = new Date(desdeStart.getFullYear(), desdeStart.getMonth(), desdeStart.getDate() + i);
    dayBuckets.set(`${d.getDate()}/${d.getMonth() + 1}`, 0);
  }
  for (const v of ventas) {
    const k = `${v.fecha.getDate()}/${v.fecha.getMonth() + 1}`;
    if (dayBuckets.has(k)) dayBuckets.set(k, (dayBuckets.get(k) || 0) + v.total);
  }
  const diarias = Array.from(dayBuckets, ([dia, total]) => ({ dia, total: Math.round(total * 100) / 100 }));

  const metodoMap = new Map<string, number>();
  for (const v of ventas) metodoMap.set(v.metodoPago, (metodoMap.get(v.metodoPago) || 0) + v.total);
  const metodos = Array.from(metodoMap, ([metodo, total]) => ({ metodo, total: Math.round(total * 100) / 100 }));

  const userMap = new Map<string, number>();
  for (const v of ventas) {
    const n = v.usuario.nombre.split(" ")[0];
    userMap.set(n, (userMap.get(n) || 0) + v.total);
  }
  const usuarios = Array.from(userMap, ([usuario, total]) => ({ usuario, total: Math.round(total * 100) / 100 }));

  const catMap = new Map<string, number>();
  const prodMap = new Map<string, number>();
  for (const d of detalles) {
    const c = d.producto.categoria.nombre;
    catMap.set(c, (catMap.get(c) || 0) + d.subtotal);
    prodMap.set(d.producto.nombre, (prodMap.get(d.producto.nombre) || 0) + d.cantidad);
  }
  const categorias = Array.from(catMap, ([categoria, total]) => ({ categoria, total: Math.round(total * 100) / 100 })).sort((a, b) => b.total - a.total);
  const topProductos = Array.from(prodMap, ([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8)
    .reverse();

  const totalVendido = ventas.reduce((s, v) => s + v.total, 0);
  const numTrans = ventas.length;
  const estrella = [...prodMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div>
      <PageHeader title="Reportes y análisis" subtitle={`Inteligencia de negocio · ${rangoLabel}`} icon={BarChart3} />

      <DateFilter rango={rango} desde={ymd(desdeStart)} hasta={ymd(hasta)} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ventas del período" value={formatBs(totalVendido)} hint="Ingresos totales" icon={DollarSign} color="brand" />
        <StatCard title="Transacciones" value={String(numTrans)} hint="Ventas completadas" icon={ShoppingBag} color="blue" />
        <StatCard title="Ticket promedio" value={formatBs(numTrans ? totalVendido / numTrans : 0)} hint="Por venta" icon={Receipt} color="violet" />
        <StatCard title="Producto estrella" value={estrella} hint="Más vendido del período" icon={Trophy} color="amber" />
      </div>

      <ReportesView
        diarias={diarias}
        categorias={categorias}
        topProductos={topProductos}
        metodos={metodos}
        usuarios={usuarios}
        rangoLabel={rangoLabel}
      />
    </div>
  );
}
