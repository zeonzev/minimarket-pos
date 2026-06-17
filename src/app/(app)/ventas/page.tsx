import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VentasClient from "@/components/ventas/VentasClient";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const session = await requireSession();

  const ventas = await prisma.venta.findMany({
    orderBy: { fecha: "desc" },
    take: 100,
    include: {
      cliente: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      detalles: { include: { producto: { select: { nombre: true } } } },
    },
  });

  const data = ventas.map((v) => ({
    id: v.id,
    numero: v.numero,
    cliente: v.cliente?.nombre ?? "Consumidor Final",
    usuario: v.usuario.nombre,
    total: v.total,
    subtotal: v.subtotal,
    descuento: v.descuento,
    metodoPago: v.metodoPago,
    montoRecibido: v.montoRecibido,
    cambio: v.cambio,
    estado: v.estado,
    fecha: v.fecha.toISOString(),
    items: v.detalles.map((d) => ({
      nombre: d.producto.nombre,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal,
    })),
  }));

  return <VentasClient ventas={data} canAnular={session.rol === "ADMIN"} />;
}
