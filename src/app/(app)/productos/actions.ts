"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export type ProductoInput = {
  id?: number;
  codigo: string;
  nombre: string;
  categoriaId: number;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  unidad: string;
};

type Result = { ok: boolean; error?: string };

export async function guardarProducto(data: ProductoInput): Promise<Result> {
  await requireSession();
  const codigo = data.codigo.trim();
  const nombre = data.nombre.trim();
  if (!codigo || !nombre) return { ok: false, error: "Código y nombre son obligatorios." };
  if (data.precioVenta <= 0) return { ok: false, error: "El precio de venta debe ser mayor a 0." };

  try {
    if (data.id) {
      const actual = await prisma.producto.findUnique({ where: { id: data.id } });
      if (!actual) return { ok: false, error: "Producto no encontrado." };
      await prisma.producto.update({
        where: { id: data.id },
        data: {
          codigo,
          nombre,
          categoriaId: data.categoriaId,
          precioCompra: data.precioCompra,
          precioVenta: data.precioVenta,
          stockMinimo: data.stockMinimo,
          unidad: data.unidad,
          stock: data.stock,
        },
      });
      if (data.stock !== actual.stock) {
        await prisma.movimientoInventario.create({
          data: {
            productoId: data.id,
            tipo: "AJUSTE",
            cantidad: data.stock - actual.stock,
            stockResultante: data.stock,
            motivo: "Ajuste manual desde edición de producto",
          },
        });
      }
    } else {
      const creado = await prisma.producto.create({
        data: {
          codigo,
          nombre,
          categoriaId: data.categoriaId,
          precioCompra: data.precioCompra,
          precioVenta: data.precioVenta,
          stock: data.stock,
          stockMinimo: data.stockMinimo,
          unidad: data.unidad,
        },
      });
      if (data.stock > 0) {
        await prisma.movimientoInventario.create({
          data: {
            productoId: creado.id,
            tipo: "ENTRADA",
            cantidad: data.stock,
            stockResultante: data.stock,
            motivo: "Stock inicial",
          },
        });
      }
    }
    revalidatePath("/productos");
    revalidatePath("/inventario");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique")
      ? "Ya existe un producto con ese código."
      : "No se pudo guardar el producto.";
    return { ok: false, error: msg };
  }
}

export async function toggleProductoActivo(id: number): Promise<Result> {
  await requireSession();
  const p = await prisma.producto.findUnique({ where: { id } });
  if (!p) return { ok: false, error: "No encontrado." };
  await prisma.producto.update({ where: { id }, data: { activo: !p.activo } });
  revalidatePath("/productos");
  return { ok: true };
}
