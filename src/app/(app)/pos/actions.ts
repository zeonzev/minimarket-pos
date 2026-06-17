"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type ItemVenta = { productoId: number; cantidad: number };

export type VentaPayload = {
  items: ItemVenta[];
  clienteId: number | null;
  metodoPago: string;
  descuento: number;
  montoRecibido: number;
};

export type ReciboItem = {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type RegistrarVentaResult =
  | {
      ok: true;
      recibo: {
        numero: string;
        fecha: string;
        cajero: string;
        cliente: string;
        items: ReciboItem[];
        subtotal: number;
        descuento: number;
        total: number;
        metodoPago: string;
        montoRecibido: number;
        cambio: number;
      };
    }
  | { ok: false; error: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function registrarVenta(
  payload: VentaPayload
): Promise<RegistrarVentaResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesión expirada." };

  if (!payload.items || payload.items.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }

  try {
    const recibo = await prisma.$transaction(async (tx) => {
      const ids = payload.items.map((i) => i.productoId);
      const productos = await tx.producto.findMany({ where: { id: { in: ids } } });

      let subtotal = 0;
      const detalles: {
        productoId: number;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }[] = [];
      const reciboItems: ReciboItem[] = [];

      for (const item of payload.items) {
        const prod = productos.find((p) => p.id === item.productoId);
        if (!prod) throw new Error("Producto no encontrado.");
        if (item.cantidad <= 0) continue;
        if (prod.stock < item.cantidad) {
          throw new Error(`Stock insuficiente de "${prod.nombre}" (disp. ${prod.stock}).`);
        }
        const sub = round2(prod.precioVenta * item.cantidad);
        subtotal += sub;
        detalles.push({
          productoId: prod.id,
          cantidad: item.cantidad,
          precioUnitario: prod.precioVenta,
          subtotal: sub,
        });
        reciboItems.push({
          nombre: prod.nombre,
          cantidad: item.cantidad,
          precioUnitario: prod.precioVenta,
          subtotal: sub,
        });
      }

      if (detalles.length === 0) throw new Error("No hay ítems válidos.");

      subtotal = round2(subtotal);
      const descuento = round2(Math.min(payload.descuento || 0, subtotal));
      const total = round2(subtotal - descuento);
      const montoRecibido =
        payload.metodoPago === "EFECTIVO"
          ? Math.max(payload.montoRecibido || 0, total)
          : total;
      const cambio = round2(montoRecibido - total);

      const count = await tx.venta.count();
      const numero = "V-" + String(count + 1).padStart(6, "0");

      const venta = await tx.venta.create({
        data: {
          numero,
          clienteId: payload.clienteId,
          usuarioId: session.id,
          subtotal,
          descuento,
          total,
          metodoPago: payload.metodoPago,
          montoRecibido,
          cambio,
          detalles: { create: detalles },
        },
      });

      // Descontar stock + kardex
      for (const d of detalles) {
        const prod = productos.find((p) => p.id === d.productoId)!;
        const nuevoStock = prod.stock - d.cantidad;
        await tx.producto.update({
          where: { id: d.productoId },
          data: { stock: nuevoStock },
        });
        await tx.movimientoInventario.create({
          data: {
            productoId: d.productoId,
            tipo: "SALIDA",
            cantidad: d.cantidad,
            stockResultante: nuevoStock,
            motivo: "Venta " + numero,
          },
        });
      }

      let clienteNombre = "Consumidor Final";
      if (payload.clienteId) {
        const c = await tx.cliente.findUnique({ where: { id: payload.clienteId } });
        if (c) clienteNombre = c.nombre;
      }

      return {
        numero,
        fecha: venta.fecha.toISOString(),
        cajero: session.nombre,
        cliente: clienteNombre,
        items: reciboItems,
        subtotal,
        descuento,
        total,
        metodoPago: payload.metodoPago,
        montoRecibido,
        cambio,
      };
    });

    revalidatePath("/");
    revalidatePath("/pos");
    revalidatePath("/ventas");
    revalidatePath("/inventario");

    return { ok: true, recibo };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al registrar la venta." };
  }
}
