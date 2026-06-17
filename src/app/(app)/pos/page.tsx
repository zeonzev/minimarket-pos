import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PosClient from "@/components/pos/PosClient";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  await requireRole("ADMIN", "CAJERO");

  const [productos, clientes] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        precioVenta: true,
        stock: true,
        unidad: true,
        categoria: { select: { nombre: true } },
      },
    }),
    prisma.cliente.findMany({ orderBy: { id: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const data = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    precioVenta: p.precioVenta,
    stock: p.stock,
    unidad: p.unidad,
    categoria: p.categoria.nombre,
  }));

  const categorias = Array.from(new Set(data.map((p) => p.categoria))).sort();

  return <PosClient productos={data} categorias={categorias} clientes={clientes} />;
}
