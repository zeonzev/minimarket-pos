import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductosClient from "@/components/productos/ProductosClient";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const session = await requireSession();
  const [productos, categorias] = await Promise.all([
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      include: { categoria: { select: { id: true, nombre: true } } },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const data = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    categoria: p.categoria.nombre,
    precioCompra: p.precioCompra,
    precioVenta: p.precioVenta,
    stock: p.stock,
    stockMinimo: p.stockMinimo,
    unidad: p.unidad,
    activo: p.activo,
  }));

  return (
    <ProductosClient
      productos={data}
      categorias={categorias}
      canEdit={session.rol === "ADMIN" || session.rol === "ALMACENERO"}
    />
  );
}
