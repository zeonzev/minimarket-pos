import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InventarioClient from "@/components/inventario/InventarioClient";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  await requireRole("ADMIN", "ALMACENERO");

  const [productos, movimientos] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      include: { categoria: { select: { nombre: true } } },
    }),
    prisma.movimientoInventario.findMany({
      orderBy: { fecha: "desc" },
      take: 40,
      include: { producto: { select: { nombre: true, unidad: true } } },
    }),
  ]);

  const data = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    codigo: p.codigo,
    categoria: p.categoria.nombre,
    stock: p.stock,
    stockMinimo: p.stockMinimo,
    unidad: p.unidad,
    precioCompra: p.precioCompra,
  }));

  const movs = movimientos.map((m) => ({
    id: m.id,
    producto: m.producto.nombre,
    unidad: m.producto.unidad,
    tipo: m.tipo,
    cantidad: m.cantidad,
    stockResultante: m.stockResultante,
    motivo: m.motivo,
    fecha: m.fecha.toISOString(),
  }));

  return <InventarioClient productos={data} movimientos={movs} />;
}
