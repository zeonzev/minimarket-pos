"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ItemCompra = { productoId: number; cantidad: number; costoUnitario: number };
export type CompraPayload = { proveedorId: number; items: ItemCompra[] };

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function registrarCompra(
  payload: CompraPayload
): Promise<{ ok: boolean; error?: string; numero?: string }> {
  const session = await requireRole("ADMIN", "ALMACENERO");
  if (!payload.proveedorId) return { ok: false, error: "Selecciona un proveedor." };
  const items = payload.items.filter((i) => i.cantidad > 0);
  if (items.length === 0) return { ok: false, error: "Agrega al menos un producto." };

  try {
    const numero = await prisma.$transaction(async (tx) => {
      const productos = await tx.producto.findMany({
        where: { id: { in: items.map((i) => i.productoId) } },
      });
      let total = 0;
      const detalles = items.map((i) => {
        const sub = round2(i.cantidad * i.costoUnitario);
        total += sub;
        return {
          productoId: i.productoId,
          cantidad: i.cantidad,
          costoUnitario: i.costoUnitario,
          subtotal: sub,
        };
      });

      const count = await tx.compra.count();
      const numero = "C-" + String(count + 1).padStart(6, "0");

      await tx.compra.create({
        data: {
          numero,
          proveedorId: payload.proveedorId,
          usuarioId: session.id,
          total: round2(total),
          estado: "RECIBIDA",
          detalles: { create: detalles },
        },
      });

      for (const d of detalles) {
        const prod = productos.find((p) => p.id === d.productoId);
        if (!prod) continue;
        const nuevoStock = prod.stock + d.cantidad;
        await tx.producto.update({
          where: { id: d.productoId },
          data: { stock: nuevoStock, precioCompra: d.costoUnitario },
        });
        await tx.movimientoInventario.create({
          data: {
            productoId: d.productoId,
            tipo: "ENTRADA",
            cantidad: d.cantidad,
            stockResultante: nuevoStock,
            motivo: "Compra " + numero,
          },
        });
      }
      return numero;
    });

    revalidatePath("/compras");
    revalidatePath("/inventario");
    revalidatePath("/productos");
    revalidatePath("/");
    return { ok: true, numero };
  } catch {
    return { ok: false, error: "No se pudo registrar la compra." };
  }
}
