"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatBs } from "@/lib/utils";

export type RespuestaAsistente = {
  respuesta: string;
  sugerencias?: string[];
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const SUGERENCIAS_BASE = [
  "¿Cuánto vendí hoy?",
  "¿Qué productos están por agotarse?",
  "¿Cuál es el producto más vendido?",
  "Valor del inventario",
];

const inicio = {
  hoy: () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  },
  mes: () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  },
};

export async function consultarAsistente(pregunta: string): Promise<RespuestaAsistente> {
  const session = await getSession();
  if (!session) return { respuesta: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const q = norm(pregunta);
  if (!q) return { respuesta: "Escribe una pregunta sobre tu negocio 🙂", sugerencias: SUGERENCIAS_BASE };

  const has = (...words: string[]) => words.some((w) => q.includes(w));

  // ---------- Ayuda / saludo ----------
  if (has("hola", "buenas", "ayuda", "que puedes", "qué puedes", "que sabes", "opciones", "menu")) {
    return {
      respuesta:
        `¡Hola, ${session.nombre.split(" ")[0]}! 👋 Soy tu asistente del minimarket. Puedo darte información en tiempo real sobre:\n\n` +
        "• 💰 Ventas (hoy, ayer, semana, mes)\n" +
        "• 📦 Stock y productos por agotarse\n" +
        "• 🏆 Productos más vendidos\n" +
        "• 💵 Valor del inventario\n" +
        "• 👥 Clientes y 🏷️ categorías\n\n" +
        "Pregúntame con tus palabras, por ejemplo:",
      sugerencias: SUGERENCIAS_BASE,
    };
  }

  // ---------- Stock / precio de un producto específico ----------
  if (has("stock de", "cuanto stock", "cuanto queda", "cuantas unidades", "hay de", "queda de", "tengo de", "precio de", "cuanto cuesta", "vale el", "vale la")) {
    const productos = await prisma.producto.findMany({
      select: { nombre: true, stock: true, stockMinimo: true, unidad: true, precioVenta: true, precioCompra: true },
    });
    // Buscar el producto cuyo nombre aparezca mejor en la pregunta
    let mejor: (typeof productos)[number] | null = null;
    let mejorLen = 0;
    for (const p of productos) {
      const np = norm(p.nombre);
      const tokens = np.split(/\s+/).filter((t) => t.length > 2);
      const hits = tokens.filter((t) => q.includes(t)).length;
      if (hits > 0 && hits >= mejorLen) {
        mejorLen = hits;
        mejor = p;
      }
    }
    if (mejor) {
      const esPrecio = has("precio", "cuesta", "vale");
      if (esPrecio) {
        return {
          respuesta: `💵 **${mejor.nombre}**\n• Precio de venta: ${formatBs(mejor.precioVenta)}\n• Precio de compra: ${formatBs(mejor.precioCompra)}\n• Margen: ${formatBs(mejor.precioVenta - mejor.precioCompra)}`,
        };
      }
      const estado = mejor.stock === 0 ? "🔴 AGOTADO" : mejor.stock <= mejor.stockMinimo ? "🟠 BAJO" : "🟢 OK";
      return {
        respuesta: `📦 **${mejor.nombre}**\n• Stock actual: ${mejor.stock} ${mejor.unidad}\n• Stock mínimo: ${mejor.stockMinimo}\n• Estado: ${estado}`,
      };
    }
    return {
      respuesta: "No encontré ese producto. Intenta con el nombre como aparece en el catálogo (ej. \"stock de Coca-Cola 2L\").",
    };
  }

  // ---------- Productos por agotarse / bajo stock ----------
  if (has("agotar", "por acabar", "bajo stock", "reponer", "reabastecer", "stock bajo", "poco stock", "alerta")) {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: { nombre: true, stock: true, stockMinimo: true, unidad: true },
    });
    const bajos = productos.filter((p) => p.stock <= p.stockMinimo).sort((a, b) => a.stock - b.stock);
    if (bajos.length === 0) return { respuesta: "✅ ¡Buenas noticias! Ningún producto está por agotarse." };
    const lista = bajos.slice(0, 10).map((p) => `• ${p.nombre} — ${p.stock}/${p.stockMinimo} ${p.unidad}`).join("\n");
    return { respuesta: `🟠 Tienes **${bajos.length}** producto(s) que requieren reposición:\n\n${lista}` };
  }

  // ---------- Agotados ----------
  if (has("agotado", "sin stock", "se acabo", "se acabaron", "cero stock")) {
    const productos = await prisma.producto.findMany({ where: { activo: true, stock: 0 }, select: { nombre: true } });
    if (productos.length === 0) return { respuesta: "✅ No hay productos agotados. Todo tiene existencias." };
    return { respuesta: `🔴 Productos agotados (${productos.length}):\n\n${productos.map((p) => `• ${p.nombre}`).join("\n")}` };
  }

  // ---------- Top productos ----------
  if (has("mas vendido", "más vendido", "top producto", "mejor producto", "que se vende", "productos estrella", "mas vende", "mas se vende")) {
    const desde = new Date(Date.now() - 30 * 86400000);
    const top = await prisma.detalleVenta.groupBy({
      by: ["productoId"],
      where: { venta: { fecha: { gte: desde }, estado: "COMPLETADA" } },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 5,
    });
    const prods = await prisma.producto.findMany({ where: { id: { in: top.map((t) => t.productoId) } }, select: { id: true, nombre: true } });
    const lista = top
      .map((t, i) => `${i + 1}. ${prods.find((p) => p.id === t.productoId)?.nombre ?? "—"} — ${t._sum.cantidad} u.`)
      .join("\n");
    return { respuesta: `🏆 Productos más vendidos (últimos 30 días):\n\n${lista}` };
  }

  // ---------- Ventas por periodo ----------
  if (has("vendi", "vendí", "venta", "ventas", "ingreso", "facturado", "factura", "recaud")) {
    let desde: Date;
    let hasta: Date | null = null;
    let etiqueta = "hoy";
    if (has("ayer")) {
      const h = inicio.hoy();
      desde = new Date(h.getTime() - 86400000);
      hasta = h;
      etiqueta = "ayer";
    } else if (has("semana", "7 dias", "ultimos dias", "últimos días")) {
      desde = new Date(Date.now() - 7 * 86400000);
      etiqueta = "los últimos 7 días";
    } else if (has("mes", "mensual", "este mes")) {
      desde = inicio.mes();
      etiqueta = "este mes";
    } else {
      desde = inicio.hoy();
      etiqueta = "hoy";
    }
    const where = {
      estado: "COMPLETADA",
      fecha: hasta ? { gte: desde, lt: hasta } : { gte: desde },
    };
    const agg = await prisma.venta.aggregate({ where, _sum: { total: true }, _count: true });
    const total = agg._sum.total ?? 0;
    const n = agg._count;
    if (n === 0) return { respuesta: `No registras ventas ${etiqueta}.` };
    const ticket = total / n;
    return {
      respuesta: `💰 Ventas de ${etiqueta}:\n\n• Total: **${formatBs(total)}**\n• Transacciones: ${n}\n• Ticket promedio: ${formatBs(ticket)}`,
    };
  }

  // ---------- Ticket promedio ----------
  if (has("ticket", "promedio por venta", "promedio de venta")) {
    const agg = await prisma.venta.aggregate({ where: { estado: "COMPLETADA", fecha: { gte: inicio.mes() } }, _sum: { total: true }, _count: true });
    const t = agg._count ? (agg._sum.total ?? 0) / agg._count : 0;
    return { respuesta: `🧾 El ticket promedio de este mes es **${formatBs(t)}** (sobre ${agg._count} ventas).` };
  }

  // ---------- Valor del inventario ----------
  if (has("valor del inventario", "valor inventario", "cuanto vale el inventario", "valorizacion", "valor de stock", "inventario vale")) {
    const productos = await prisma.producto.findMany({ where: { activo: true }, select: { stock: true, precioCompra: true, precioVenta: true } });
    const costo = productos.reduce((s, p) => s + p.stock * p.precioCompra, 0);
    const venta = productos.reduce((s, p) => s + p.stock * p.precioVenta, 0);
    return {
      respuesta: `💵 Valor del inventario:\n\n• A costo: **${formatBs(costo)}**\n• A precio de venta: ${formatBs(venta)}\n• Utilidad potencial: ${formatBs(venta - costo)}`,
    };
  }

  // ---------- Categoría más vendida ----------
  if (has("categoria", "categoría", "rubro", "que tipo")) {
    const desde = new Date(Date.now() - 30 * 86400000);
    const detalles = await prisma.detalleVenta.findMany({
      where: { venta: { fecha: { gte: desde }, estado: "COMPLETADA" } },
      select: { subtotal: true, producto: { select: { categoria: { select: { nombre: true } } } } },
    });
    const map = new Map<string, number>();
    for (const d of detalles) map.set(d.producto.categoria.nombre, (map.get(d.producto.categoria.nombre) || 0) + d.subtotal);
    const orden = [...map.entries()].sort((a, b) => b[1] - a[1]);
    if (orden.length === 0) return { respuesta: "Aún no hay ventas para analizar por categoría." };
    const lista = orden.slice(0, 5).map(([c, v], i) => `${i + 1}. ${c} — ${formatBs(v)}`).join("\n");
    return { respuesta: `🏷️ Ventas por categoría (últimos 30 días):\n\n${lista}` };
  }

  // ---------- Clientes ----------
  if (has("cliente")) {
    if (has("mas compra", "más compra", "mejor cliente", "mas gasta", "más gasta", "top cliente", "frecuente")) {
      const clientes = await prisma.cliente.findMany({ select: { nombre: true, ventas: { select: { total: true } } } });
      const ranked = clientes
        .map((c) => ({ nombre: c.nombre, total: c.ventas.reduce((s, v) => s + v.total, 0), n: c.ventas.length }))
        .filter((c) => c.nombre !== "Consumidor Final" && c.n > 0)
        .sort((a, b) => b.total - a.total);
      if (ranked.length === 0) return { respuesta: "Aún no hay clientes con compras registradas (la mayoría son como 'Consumidor Final')." };
      const lista = ranked.slice(0, 5).map((c, i) => `${i + 1}. ${c.nombre} — ${formatBs(c.total)} (${c.n} compras)`).join("\n");
      return { respuesta: `👑 Tus mejores clientes:\n\n${lista}` };
    }
    const n = await prisma.cliente.count();
    return { respuesta: `👥 Tienes **${n}** clientes registrados.` };
  }

  // ---------- Métodos de pago ----------
  if (has("metodo de pago", "método de pago", "como pagan", "cómo pagan", "efectivo", "qr", "tarjeta", "forma de pago")) {
    const desde = new Date(Date.now() - 30 * 86400000);
    const ventas = await prisma.venta.findMany({ where: { fecha: { gte: desde }, estado: "COMPLETADA" }, select: { metodoPago: true, total: true } });
    const map = new Map<string, number>();
    for (const v of ventas) map.set(v.metodoPago, (map.get(v.metodoPago) || 0) + v.total);
    const orden = [...map.entries()].sort((a, b) => b[1] - a[1]);
    if (orden.length === 0) return { respuesta: "Aún no hay ventas para analizar los métodos de pago." };
    const lista = orden.map(([m, v]) => `• ${m}: ${formatBs(v)}`).join("\n");
    return { respuesta: `💳 Métodos de pago (últimos 30 días):\n\n${lista}` };
  }

  // ---------- Conteo de productos ----------
  if (has("cuantos productos", "cuántos productos", "total de productos", "productos tengo", "productos hay", "catalogo")) {
    const activos = await prisma.producto.count({ where: { activo: true } });
    const cats = await prisma.categoria.count();
    return { respuesta: `📦 Tienes **${activos}** productos activos en ${cats} categorías.` };
  }

  // ---------- Cuántas ventas (total) ----------
  if (has("cuantas ventas", "cuántas ventas", "numero de ventas", "número de ventas", "total de ventas")) {
    const n = await prisma.venta.count({ where: { estado: "COMPLETADA" } });
    return { respuesta: `🧾 Hay **${n}** ventas registradas en total.` };
  }

  // ---------- Fallback ----------
  return {
    respuesta:
      "Mmm, no estoy seguro de haber entendido 🤔. Puedo ayudarte con ventas, stock, productos más vendidos, inventario, clientes y categorías. Prueba con una de estas:",
    sugerencias: SUGERENCIAS_BASE,
  };
}
