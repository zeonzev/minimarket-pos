import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClientesClient from "@/components/clientes/ClientesClient";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await requireRole("ADMIN", "CAJERO");
  const clientes = await prisma.cliente.findMany({
    orderBy: { id: "asc" },
    include: {
      _count: { select: { ventas: true } },
      ventas: { select: { total: true } },
    },
  });

  const data = clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    nit: c.nit ?? "",
    telefono: c.telefono ?? "",
    email: c.email ?? "",
    direccion: c.direccion ?? "",
    compras: c._count.ventas,
    totalGastado: c.ventas.reduce((s, v) => s + v.total, 0),
  }));

  return <ClientesClient clientes={data} />;
}
