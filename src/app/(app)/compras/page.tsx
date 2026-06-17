import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ComprasClient from "@/components/compras/ComprasClient";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  await requireRole("ADMIN", "ALMACENERO");

  const [compras, proveedores, productos] = await Promise.all([
    prisma.compra.findMany({
      orderBy: { fecha: "desc" },
      take: 50,
      include: {
        proveedor: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
        _count: { select: { detalles: true } },
      },
    }),
    prisma.proveedor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, precioCompra: true, unidad: true, stock: true },
    }),
  ]);

  const comprasData = compras.map((c) => ({
    id: c.id,
    numero: c.numero,
    proveedor: c.proveedor.nombre,
    usuario: c.usuario.nombre,
    items: c._count.detalles,
    total: c.total,
    estado: c.estado,
    fecha: c.fecha.toISOString(),
  }));

  return (
    <ComprasClient compras={comprasData} proveedores={proveedores} productos={productos} />
  );
}
