// =====================================================================
//  Seed de datos — Minimarket "El Surtidor" (datos realistas, Bolivia)
//  Ejecutar:  node prisma/seed.mjs
// =====================================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
  console.log("⏳ Limpiando base de datos...");
  await prisma.detalleVenta.deleteMany();
  await prisma.detalleCompra.deleteMany();
  await prisma.movimientoInventario.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.rol.deleteMany();
  // Reiniciar contadores autoincrement -> IDs deterministas (admin siempre = 1)
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence;").catch(() => {});

  // ----------------------------- Roles -----------------------------
  console.log("👥 Creando roles y usuarios...");
  const rolAdmin = await prisma.rol.create({
    data: { nombre: "ADMIN", descripcion: "Administrador del sistema (acceso total)" },
  });
  const rolCajero = await prisma.rol.create({
    data: { nombre: "CAJERO", descripcion: "Operador de punto de venta y clientes" },
  });
  const rolAlmacen = await prisma.rol.create({
    data: { nombre: "ALMACENERO", descripcion: "Gestión de inventario, compras y proveedores" },
  });

  const hash = (p) => bcrypt.hashSync(p, 10);
  const [admin, cajero] = await Promise.all([
    prisma.usuario.create({
      data: { nombre: "Jonathan Ticona", usuario: "admin", email: "admin@minimarket.bo", passwordHash: hash("admin123"), rolId: rolAdmin.id },
    }),
    prisma.usuario.create({
      data: { nombre: "José Ariel Apaza", usuario: "cajero", email: "cajero@minimarket.bo", passwordHash: hash("cajero123"), rolId: rolCajero.id },
    }),
    prisma.usuario.create({
      data: { nombre: "Andrés Flores", usuario: "almacen", email: "almacen@minimarket.bo", passwordHash: hash("almacen123"), rolId: rolAlmacen.id },
    }),
    prisma.usuario.create({
      data: { nombre: "Leonel Gorostiaga", usuario: "supervisor", email: "supervisor@minimarket.bo", passwordHash: hash("super123"), rolId: rolAdmin.id, activo: true },
    }),
  ]);

  // ----------------------------- Categorías -----------------------------
  console.log("🏷️  Creando categorías...");
  const catData = [
    ["Bebidas", "Gaseosas, aguas, jugos y energizantes"],
    ["Lácteos", "Leche, yogurt, quesos y derivados"],
    ["Abarrotes", "Arroz, azúcar, aceite, fideos y enlatados"],
    ["Snacks y Golosinas", "Galletas, chocolates, papas fritas y dulces"],
    ["Limpieza y Hogar", "Detergentes, lavandina y artículos de aseo"],
    ["Cuidado Personal", "Shampoo, jabones, pasta dental y desodorantes"],
    ["Panadería", "Pan, repostería y productos de panadería"],
    ["Carnes y Embutidos", "Pollo, salchichas, mortadela y fiambres"],
  ];
  const cats = {};
  for (const [nombre, descripcion] of catData) {
    const c = await prisma.categoria.create({ data: { nombre, descripcion } });
    cats[nombre] = c.id;
  }

  // ----------------------------- Proveedores -----------------------------
  console.log("🚚 Creando proveedores...");
  const provData = [
    ["Embol S.A. (Coca-Cola)", "1020304050", "2-2451000"],
    ["PIL Andina S.A.", "1023456789", "2-2820000"],
    ["Distribuidora La Paz S.R.L.", "3045678901", "2-2789456"],
    ["Industrias Venado", "1098765432", "4-4523120"],
    ["Sofía Ltda.", "1011223344", "3-3460000"],
  ];
  const provs = [];
  for (const [nombre, nit, telefono] of provData) {
    const p = await prisma.proveedor.create({ data: { nombre, nit, telefono, email: nombre.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8) + "@proveedor.bo" } });
    provs.push(p.id);
  }

  // ----------------------------- Productos -----------------------------
  console.log("📦 Creando catálogo de productos...");
  // [codigo, nombre, categoria, precioCompra, precioVenta, stockBase, stockMinimo, unidad]
  const prodData = [
    ["7790001000017", "Coca-Cola 2L", "Bebidas", 10, 13, 60, 12, "UND"],
    ["7790001000024", "Coca-Cola 600ml", "Bebidas", 4, 6, 80, 18, "UND"],
    ["7790001000031", "Sprite 2L", "Bebidas", 10, 13, 40, 10, "UND"],
    ["7790001000048", "Agua Vital 2L", "Bebidas", 4, 6, 70, 15, "UND"],
    ["7790001000055", "Jugo Del Valle 1L", "Bebidas", 7, 10, 45, 10, "UND"],
    ["7790001000062", "Pil Frut 1L", "Bebidas", 6, 9, 50, 12, "UND"],
    ["7790001000079", "Red Bull 250ml", "Bebidas", 12, 16, 30, 8, "UND"],
    ["7790001000086", "Cerveza Paceña 620ml", "Bebidas", 8, 12, 48, 12, "UND"],

    ["7790002000011", "Leche PIL Entera 1L", "Lácteos", 6.5, 8.5, 90, 20, "UND"],
    ["7790002000028", "Yogurt PIL Frutilla 1L", "Lácteos", 12, 16, 35, 8, "UND"],
    ["7790002000035", "Queso Menonita 250g", "Lácteos", 18, 24, 24, 6, "UND"],
    ["7790002000042", "Mantequilla PIL 200g", "Lácteos", 10, 14, 28, 6, "UND"],
    ["7790002000059", "Huevos (paquete x30)", "Lácteos", 22, 28, 22, 5, "PACK"],

    ["7790003000010", "Arroz Grano de Oro 1kg", "Abarrotes", 7, 9.5, 100, 20, "UND"],
    ["7790003000027", "Azúcar Guabirá 1kg", "Abarrotes", 5, 7, 95, 20, "UND"],
    ["7790003000034", "Aceite Fino 900ml", "Abarrotes", 11, 15, 60, 15, "UND"],
    ["7790003000041", "Fideo Lazo 400g", "Abarrotes", 4, 6, 70, 15, "UND"],
    ["7790003000058", "Harina Princesa 1kg", "Abarrotes", 5.5, 8, 55, 12, "UND"],
    ["7790003000065", "Sal Yodada 1kg", "Abarrotes", 2, 3.5, 80, 15, "UND"],
    ["7790003000072", "Atún Real en lata", "Abarrotes", 8, 11, 50, 12, "UND"],
    ["7790003000089", "Lenteja 500g", "Abarrotes", 6, 8.5, 40, 10, "UND"],

    ["7790004000019", "Galleta Oreo", "Snacks y Golosinas", 3, 5, 120, 24, "UND"],
    ["7790004000026", "Chizitos", "Snacks y Golosinas", 2.5, 4, 90, 20, "UND"],
    ["7790004000033", "Chocolate Cordillera", "Snacks y Golosinas", 5, 7.5, 60, 15, "UND"],
    ["7790004000040", "Papas Lays Clásicas", "Snacks y Golosinas", 6, 9, 70, 15, "UND"],
    ["7790004000057", "Chicle Bubaloo", "Snacks y Golosinas", 0.5, 1, 200, 40, "UND"],

    ["7790005000018", "Detergente Ola 1kg", "Limpieza y Hogar", 14, 19, 40, 10, "UND"],
    ["7790005000025", "Lavandina Clorox 1L", "Limpieza y Hogar", 6, 9, 45, 10, "UND"],
    ["7790005000032", "Jabón en barra Uno x3", "Limpieza y Hogar", 7, 10, 50, 12, "PACK"],
    ["7790005000049", "Papel Higiénico Scott x4", "Limpieza y Hogar", 9, 13, 55, 12, "PACK"],
    ["7790005000056", "Esponja Scotch Brite", "Limpieza y Hogar", 3, 5, 60, 15, "UND"],

    ["7790006000017", "Shampoo Sedal 340ml", "Cuidado Personal", 16, 22, 30, 8, "UND"],
    ["7790006000024", "Pasta Dental Colgate 90g", "Cuidado Personal", 7, 10, 45, 10, "UND"],
    ["7790006000031", "Jabón de tocador Lux", "Cuidado Personal", 4, 6, 70, 15, "UND"],
    ["7790006000048", "Desodorante Rexona", "Cuidado Personal", 15, 21, 28, 8, "UND"],

    ["7790007000016", "Pan Marraqueta (unidad)", "Panadería", 0.4, 0.5, 300, 50, "UND"],
    ["7790007000023", "Pan de Molde Bimbo", "Panadería", 12, 16, 20, 6, "UND"],

    ["7790008000015", "Salchicha Stege 250g", "Carnes y Embutidos", 14, 19, 30, 8, "UND"],
    ["7790008000022", "Mortadela Sofía 200g", "Carnes y Embutidos", 10, 14, 32, 8, "UND"],
    ["7790008000039", "Pollo entero", "Carnes y Embutidos", 14, 18, 25, 6, "KG"],
  ];

  const productos = [];
  for (const [codigo, nombre, cat, pc, pv, , min, unidad] of prodData) {
    const p = await prisma.producto.create({
      data: {
        codigo, nombre, categoriaId: cats[cat],
        precioCompra: pc, precioVenta: pv,
        stock: 0, stockMinimo: min, unidad,
      },
    });
    productos.push({ ...p, _base: prodData.find((x) => x[0] === codigo)[5] });
  }

  // ----------------------------- Inventario inicial (ENTRADA) -----------------------------
  console.log("📥 Registrando inventario inicial (kardex)...");
  const stockMap = new Map(); // productoId -> stock actual
  const hace = (dias) => new Date(Date.now() - dias * 86400000);
  for (const p of productos) {
    // Stock inicial holgado para que 14 días de ventas no agoten ningún producto.
    // El bajo stock se fuerza luego de forma intencional para las alertas.
    const base = Math.round(p._base * 2.2) + 40;
    await prisma.movimientoInventario.create({
      data: { productoId: p.id, tipo: "ENTRADA", cantidad: base, stockResultante: base, motivo: "Inventario inicial", fecha: hace(16) },
    });
    stockMap.set(p.id, base);
  }

  // ----------------------------- Clientes -----------------------------
  console.log("🧑 Creando clientes...");
  const cli0 = await prisma.cliente.create({ data: { nombre: "Consumidor Final", nit: "0" } });
  const cliData = [
    ["María Quispe", "6789012", "70011223", "Av. Buenos Aires #234"],
    ["Pensión Doña Rosa", "1234567018", "71234567", "Calle Comercio #45"],
    ["Carlos Mamani", "9087654", "68900112", "Villa Fátima, Calle 3"],
    ["Tienda La Esquina", "3456789011", "72345678", "Zona Sur, Calacoto"],
    ["Ana Choque", "5544332", "69887766", "El Alto, Ceja"],
  ];
  const clientes = [cli0.id];
  for (const [nombre, nit, telefono, direccion] of cliData) {
    const c = await prisma.cliente.create({ data: { nombre, nit, telefono, direccion } });
    clientes.push(c.id);
  }

  // ----------------------------- Compras históricas -----------------------------
  console.log("🛒 Registrando compras a proveedores...");
  let compraSeq = 0;
  for (const diasAtras of [12, 7, 3]) {
    compraSeq++;
    const items = [];
    const seleccion = [...productos].sort(() => 0.5 - Math.random()).slice(0, rnd(5, 8));
    let total = 0;
    for (const p of seleccion) {
      const cantidad = rnd(20, 60);
      const subtotal = round2(cantidad * p.precioCompra);
      total += subtotal;
      items.push({ productoId: p.id, cantidad, costoUnitario: p.precioCompra, subtotal });
    }
    const compra = await prisma.compra.create({
      data: {
        numero: "C-" + String(compraSeq).padStart(6, "0"),
        proveedorId: pick(provs), usuarioId: admin.id,
        total: round2(total), estado: "RECIBIDA", fecha: hace(diasAtras),
        detalles: { create: items },
      },
    });
    for (const it of items) {
      const nuevo = (stockMap.get(it.productoId) || 0) + it.cantidad;
      stockMap.set(it.productoId, nuevo);
      await prisma.movimientoInventario.create({
        data: { productoId: it.productoId, tipo: "ENTRADA", cantidad: it.cantidad, stockResultante: nuevo, motivo: "Compra " + compra.numero, fecha: hace(diasAtras) },
      });
    }
  }

  // ----------------------------- Ventas históricas (últimos 14 días) -----------------------------
  console.log("💰 Generando historial de ventas (14 días)...");
  const metodos = ["EFECTIVO", "EFECTIVO", "EFECTIVO", "QR", "QR", "TARJETA"];
  let ventaSeq = 0;
  for (let d = 14; d >= 0; d--) {
    const ventasDia = d === 0 ? rnd(4, 9) : rnd(5, 14); // hoy con algo de actividad
    for (let v = 0; v < ventasDia; v++) {
      const nItems = rnd(1, 5);
      const elegidos = [...productos].sort(() => 0.5 - Math.random()).slice(0, nItems);
      const detalles = [];
      let subtotal = 0;
      for (const p of elegidos) {
        const disp = stockMap.get(p.id) || 0;
        if (disp <= 0) continue;
        const cantidad = Math.min(rnd(1, 4), disp);
        const sub = round2(cantidad * p.precioVenta);
        subtotal += sub;
        detalles.push({ productoId: p.id, cantidad, precioUnitario: p.precioVenta, subtotal: sub });
      }
      if (detalles.length === 0) continue;
      subtotal = round2(subtotal);
      const descuento = Math.random() < 0.15 ? round2(subtotal * 0.05) : 0;
      const total = round2(subtotal - descuento);
      const metodoPago = pick(metodos);
      const montoRecibido = metodoPago === "EFECTIVO" ? Math.ceil(total / 5) * 5 : total;
      const hora = rnd(8, 21);
      const fecha = new Date(Date.now() - d * 86400000);
      fecha.setHours(hora, rnd(0, 59), 0, 0);
      ventaSeq++;
      const venta = await prisma.venta.create({
        data: {
          numero: "V-" + String(ventaSeq).padStart(6, "0"),
          fecha, clienteId: Math.random() < 0.6 ? cli0.id : pick(clientes),
          usuarioId: Math.random() < 0.5 ? cajero.id : admin.id,
          subtotal, descuento, total, metodoPago,
          montoRecibido, cambio: round2(montoRecibido - total),
          detalles: { create: detalles },
        },
      });
      for (const it of detalles) {
        const nuevo = (stockMap.get(it.productoId) || 0) - it.cantidad;
        stockMap.set(it.productoId, nuevo);
        await prisma.movimientoInventario.create({
          data: { productoId: it.productoId, tipo: "SALIDA", cantidad: it.cantidad, stockResultante: nuevo, motivo: "Venta " + venta.numero, fecha },
        });
      }
    }
  }

  // ----------------------------- Sincronizar stock final + forzar bajo stock -----------------------------
  console.log("🔄 Sincronizando stock final...");
  for (const [productoId, stock] of stockMap) {
    await prisma.producto.update({ where: { id: productoId }, data: { stock: Math.max(0, stock) } });
  }
  // Forzar algunos productos en bajo stock para mostrar alertas
  const bajos = [
    ["7790002000035", 4],  // Queso Menonita (min 6)
    ["7790003000034", 9],  // Aceite Fino (min 15)
    ["7790006000017", 3],  // Shampoo Sedal (min 8)
    ["7790007000023", 2],  // Pan de Molde (min 6)
  ];
  for (const [codigo, nuevo] of bajos) {
    const p = await prisma.producto.findUnique({ where: { codigo } });
    if (p) {
      await prisma.producto.update({ where: { id: p.id }, data: { stock: nuevo } });
      await prisma.movimientoInventario.create({
        data: { productoId: p.id, tipo: "AJUSTE", cantidad: nuevo - p.stock, stockResultante: nuevo, motivo: "Ajuste por conteo físico", fecha: hace(1) },
      });
    }
  }

  const totVentas = await prisma.venta.count();
  const totProd = await prisma.producto.count();
  console.log(`\n✅ Seed completado:`);
  console.log(`   • ${totProd} productos en ${catData.length} categorías`);
  console.log(`   • ${totVentas} ventas registradas (14 días)`);
  console.log(`   • 4 usuarios | 3 compras | ${clientes.length} clientes`);
  console.log(`\n   Credenciales de acceso:`);
  console.log(`   ADMIN      → usuario: admin     contraseña: admin123`);
  console.log(`   CAJERO     → usuario: cajero    contraseña: cajero123`);
  console.log(`   ALMACENERO → usuario: almacen   contraseña: almacen123`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
