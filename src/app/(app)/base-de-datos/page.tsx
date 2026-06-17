import { Database } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { formatBs, formatFechaHora } from "@/lib/utils";
import BaseDatosClient, { type TablaPreview } from "@/components/basedatos/BaseDatosClient";

export const dynamic = "force-dynamic";

export default async function BaseDatosPage() {
  await requireRole("ADMIN");

  const [
    cRol, cUsuario, cCategoria, cProducto, cProveedor, cCliente, cVenta, cDetVenta, cCompra, cDetCompra, cMov,
    roles, usuarios, categorias, productos, proveedores, clientes, ventas, detVentas, compras, movimientos,
  ] = await Promise.all([
    prisma.rol.count(), prisma.usuario.count(), prisma.categoria.count(), prisma.producto.count(),
    prisma.proveedor.count(), prisma.cliente.count(), prisma.venta.count(), prisma.detalleVenta.count(),
    prisma.compra.count(), prisma.detalleCompra.count(), prisma.movimientoInventario.count(),
    prisma.rol.findMany(),
    prisma.usuario.findMany({ take: 10, include: { rol: true } }),
    prisma.categoria.findMany({ take: 10 }),
    prisma.producto.findMany({ take: 10, orderBy: { id: "asc" } }),
    prisma.proveedor.findMany({ take: 10 }),
    prisma.cliente.findMany({ take: 10 }),
    prisma.venta.findMany({ take: 10, orderBy: { fecha: "desc" } }),
    prisma.detalleVenta.findMany({ take: 10, orderBy: { id: "desc" } }),
    prisma.compra.findMany({ take: 10, orderBy: { id: "desc" } }),
    prisma.movimientoInventario.findMany({ take: 10, orderBy: { id: "desc" } }),
  ]);

  const tablas: TablaPreview[] = [
    {
      nombre: "Usuario", registros: cUsuario,
      columnas: ["id", "nombre", "usuario", "rol", "activo"],
      filas: usuarios.map((u) => [u.id, u.nombre, u.usuario, u.rol.nombre, u.activo ? "Sí" : "No"]),
    },
    {
      nombre: "Rol", registros: cRol,
      columnas: ["id", "nombre", "descripcion"],
      filas: roles.map((r) => [r.id, r.nombre, r.descripcion]),
    },
    {
      nombre: "Producto", registros: cProducto,
      columnas: ["id", "codigo", "nombre", "precioVenta", "stock"],
      filas: productos.map((p) => [p.id, p.codigo, p.nombre, formatBs(p.precioVenta), p.stock]),
    },
    {
      nombre: "Categoria", registros: cCategoria,
      columnas: ["id", "nombre", "descripcion"],
      filas: categorias.map((c) => [c.id, c.nombre, c.descripcion ?? "—"]),
    },
    {
      nombre: "Cliente", registros: cCliente,
      columnas: ["id", "nombre", "nit", "telefono"],
      filas: clientes.map((c) => [c.id, c.nombre, c.nit ?? "—", c.telefono ?? "—"]),
    },
    {
      nombre: "Proveedor", registros: cProveedor,
      columnas: ["id", "nombre", "nit", "telefono"],
      filas: proveedores.map((p) => [p.id, p.nombre, p.nit ?? "—", p.telefono ?? "—"]),
    },
    {
      nombre: "Venta", registros: cVenta,
      columnas: ["numero", "total", "metodoPago", "estado", "fecha"],
      filas: ventas.map((v) => [v.numero, formatBs(v.total), v.metodoPago, v.estado, formatFechaHora(v.fecha)]),
    },
    {
      nombre: "DetalleVenta", registros: cDetVenta,
      columnas: ["id", "ventaId", "productoId", "cantidad", "subtotal"],
      filas: detVentas.map((d) => [d.id, d.ventaId, d.productoId, d.cantidad, formatBs(d.subtotal)]),
    },
    {
      nombre: "Compra", registros: cCompra,
      columnas: ["numero", "total", "estado"],
      filas: compras.map((c) => [c.numero, formatBs(c.total), c.estado]),
    },
    {
      nombre: "DetalleCompra", registros: cDetCompra,
      columnas: ["id", "compraId", "productoId", "cantidad", "subtotal"],
      filas: [],
    },
    {
      nombre: "MovimientoInventario", registros: cMov,
      columnas: ["id", "tipo", "cantidad", "stockResultante", "motivo"],
      filas: movimientos.map((m) => [m.id, m.tipo, m.cantidad, m.stockResultante, m.motivo]),
    },
  ];

  // Rellenar DetalleCompra
  const detCompras = await prisma.detalleCompra.findMany({ take: 10, orderBy: { id: "desc" } });
  const dc = tablas.find((t) => t.nombre === "DetalleCompra")!;
  dc.filas = detCompras.map((d) => [d.id, d.compraId, d.productoId, d.cantidad, formatBs(d.subtotal)]);

  const registrosTotales =
    cRol + cUsuario + cCategoria + cProducto + cProveedor + cCliente + cVenta + cDetVenta + cCompra + cDetCompra + cMov;

  return (
    <div>
      <PageHeader
        title="Base de Datos"
        subtitle="Modelo de datos y registros del sistema"
        icon={Database}
      />
      <BaseDatosClient tablas={tablas} motor={{ entidades: 11, registros: registrosTotales }} />
    </div>
  );
}
