import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsuariosClient from "@/components/usuarios/UsuariosClient";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await requireRole("ADMIN");
  const [usuarios, roles] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: { id: "asc" },
      include: { rol: true, _count: { select: { ventas: true } } },
    }),
    prisma.rol.findMany({ orderBy: { id: "asc" } }),
  ]);

  const data = usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    email: u.email,
    rolId: u.rolId,
    rol: u.rol.nombre,
    activo: u.activo,
    ventas: u._count.ventas,
    ultimoAcceso: u.ultimoAcceso ? u.ultimoAcceso.toISOString() : null,
  }));

  return <UsuariosClient usuarios={data} roles={roles} currentUserId={session.id} />;
}
