"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ClienteInput = {
  id?: number;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
};

type Result = { ok: boolean; error?: string };

export async function guardarCliente(data: ClienteInput): Promise<Result> {
  await requireRole("ADMIN", "CAJERO");
  if (!data.nombre.trim()) return { ok: false, error: "El nombre es obligatorio." };
  const payload = {
    nombre: data.nombre.trim(),
    nit: data.nit.trim() || null,
    telefono: data.telefono.trim() || null,
    email: data.email.trim() || null,
    direccion: data.direccion.trim() || null,
  };
  try {
    if (data.id) {
      await prisma.cliente.update({ where: { id: data.id }, data: payload });
    } else {
      await prisma.cliente.create({ data: payload });
    }
    revalidatePath("/clientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el cliente." };
  }
}

export async function eliminarCliente(id: number): Promise<Result> {
  await requireRole("ADMIN", "CAJERO");
  if (id === 1) return { ok: false, error: "No se puede eliminar 'Consumidor Final'." };
  const ventas = await prisma.venta.count({ where: { clienteId: id } });
  if (ventas > 0)
    return { ok: false, error: "El cliente tiene ventas asociadas y no puede eliminarse." };
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  return { ok: true };
}
