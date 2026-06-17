"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function anularVenta(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN");
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: { detalles: true },
  });
  if (!venta) return { ok: false, error: "Venta no encontrada." };
  if (venta.estado === "ANULADA") return { ok: false, error: "La venta ya está anulada." };

  await prisma.$transaction(async (tx) => {
    for (const d of venta.detalles) {
      const prod = await tx.producto.findUnique({ where: { id: d.productoId } });
      if (!prod) continue;
      const nuevoStock = prod.stock + d.cantidad;
      await tx.producto.update({ where: { id: d.productoId }, data: { stock: nuevoStock } });
      await tx.movimientoInventario.create({
        data: {
          productoId: d.productoId,
          tipo: "ENTRADA",
          cantidad: d.cantidad,
          stockResultante: nuevoStock,
          motivo: "Anulación " + venta.numero,
        },
      });
    }
    await tx.venta.update({ where: { id }, data: { estado: "ANULADA" } });
  });

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/");
  return { ok: true };
}
