"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type UsuarioInput = {
  id?: number;
  nombre: string;
  usuario: string;
  email: string;
  rolId: number;
  password?: string;
  activo: boolean;
};

type Result = { ok: boolean; error?: string };

export async function guardarUsuario(data: UsuarioInput): Promise<Result> {
  await requireRole("ADMIN");
  const nombre = data.nombre.trim();
  const usuario = data.usuario.trim().toLowerCase();
  const email = data.email.trim().toLowerCase();
  if (!nombre || !usuario || !email) return { ok: false, error: "Completa todos los campos." };

  try {
    if (data.id) {
      const dataUpd: Record<string, unknown> = {
        nombre,
        usuario,
        email,
        rolId: data.rolId,
        activo: data.activo,
      };
      if (data.password && data.password.length >= 4) {
        dataUpd.passwordHash = bcrypt.hashSync(data.password, 10);
      }
      await prisma.usuario.update({ where: { id: data.id }, data: dataUpd });
    } else {
      if (!data.password || data.password.length < 4)
        return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
      await prisma.usuario.create({
        data: {
          nombre,
          usuario,
          email,
          rolId: data.rolId,
          activo: data.activo,
          passwordHash: bcrypt.hashSync(data.password, 10),
        },
      });
    }
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "El usuario o correo ya existe."
        : "No se pudo guardar el usuario.";
    return { ok: false, error: msg };
  }
}

export async function toggleUsuario(id: number): Promise<Result> {
  const session = await requireRole("ADMIN");
  if (id === session.id) return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) return { ok: false, error: "No encontrado." };
  await prisma.usuario.update({ where: { id }, data: { activo: !u.activo } });
  revalidatePath("/usuarios");
  return { ok: true };
}
