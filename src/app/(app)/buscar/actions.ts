"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type ResultadoBusqueda = {
  productos: { id: number; nombre: string; codigo: string; stock: number; unidad: string }[];
  clientes: { id: number; nombre: string; nit: string | null }[];
  ventas: { id: number; numero: string; total: number; cliente: string }[];
};

export async function buscarGlobal(qRaw: string): Promise<ResultadoBusqueda> {
  const session = await getSession();
  const q = qRaw.trim();
  if (!session || q.length < 2) return { productos: [], clientes: [], ventas: [] };

  const [productos, clientes, ventas] = await Promise.all([
    prisma.producto.findMany({
      where: {
        OR: [{ nombre: { contains: q } }, { codigo: { contains: q } }],
      },
      take: 5,
      select: { id: true, nombre: true, codigo: true, stock: true, unidad: true },
    }),
    prisma.cliente.findMany({
      where: { OR: [{ nombre: { contains: q } }, { nit: { contains: q } }] },
      take: 4,
      select: { id: true, nombre: true, nit: true },
    }),
    prisma.venta.findMany({
      where: { numero: { contains: q } },
      take: 4,
      include: { cliente: { select: { nombre: true } } },
      orderBy: { fecha: "desc" },
    }),
  ]);

  return {
    productos,
    clientes,
    ventas: ventas.map((v) => ({
      id: v.id,
      numero: v.numero,
      total: v.total,
      cliente: v.cliente?.nombre ?? "Consumidor Final",
    })),
  };
}
