"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function ajustarStock(
  productoId: number,
  nuevoStock: number,
  motivo: string
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN", "ALMACENERO");
  if (nuevoStock < 0) return { ok: false, error: "El stock no puede ser negativo." };
  const p = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!p) return { ok: false, error: "Producto no encontrado." };

  const diff = nuevoStock - p.stock;
  await prisma.$transaction([
    prisma.producto.update({ where: { id: productoId }, data: { stock: nuevoStock } }),
    prisma.movimientoInventario.create({
      data: {
        productoId,
        tipo: "AJUSTE",
        cantidad: diff,
        stockResultante: nuevoStock,
        motivo: motivo.trim() || "Ajuste de inventario",
      },
    }),
  ]);

  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/");
  return { ok: true };
}
