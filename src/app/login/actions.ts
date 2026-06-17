"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const usuario = String(formData.get("usuario") || "").trim();
  const password = String(formData.get("password") || "");

  if (!usuario || !password) {
    return { error: "Ingrese usuario y contraseña." };
  }

  const user = await prisma.usuario.findFirst({
    where: { usuario },
    include: { rol: true },
  });

  if (!user || !user.activo || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimoAcceso: new Date() },
  });

  await createSession({
    id: user.id,
    nombre: user.nombre,
    usuario: user.usuario,
    rol: user.rol.nombre,
  });

  redirect("/");
}
