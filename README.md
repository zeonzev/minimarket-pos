# 🛒 Sistema de Gestión para Minimarkets — "El Surtidor"

Sistema POS (punto de venta) y de gestión integral para minimarkets.
**UNIFRANZ · Ingeniería en Sistemas · Gestión 2026.**

Aplicación web full‑stack, lista para producción, que funciona en **localhost**.

---

## ▶️ Cómo iniciar el sistema (rápido)

**Opción fácil:** doble clic en **`INICIAR_SISTEMA.bat`**.
Se abrirá el navegador en `http://localhost:3000`.

**Opción manual** (terminal en esta carpeta):

```bash
npm install        # solo la primera vez
npm run build      # compila para producción (ya está hecho)
npm run start      # inicia en http://localhost:3000
```

> Modo desarrollo (con recarga en caliente): `npm run dev`

---

## 🔑 Usuarios de prueba

| Rol           | Usuario   | Contraseña   | Acceso                                  |
|---------------|-----------|--------------|-----------------------------------------|
| Administrador | `admin`   | `admin123`   | Todo el sistema                         |
| Cajero        | `cajero`  | `cajero123`  | Punto de venta, ventas, clientes        |
| Almacenero    | `almacen` | `almacen123` | Inventario, compras, productos          |

---

## 🧩 Módulos del sistema

1. **Dashboard** — KPIs en tiempo real, tendencia de ventas, ventas por categoría, productos más vendidos, alertas de stock.
2. **Punto de Venta (POS)** — búsqueda/escaneo de productos, carrito, descuentos, métodos de pago (efectivo/QR/tarjeta), cálculo de cambio y comprobante.
3. **Ventas** — historial completo, detalle de cada venta, anulación con reposición de stock.
4. **Inventario** — existencias, valorización, alertas de stock mínimo, ajustes y **kardex** (movimientos).
5. **Compras** — registro de compras a proveedores que **reabastecen** el stock automáticamente.
6. **Productos** — catálogo completo con categorías (CRUD).
7. **Clientes** — registro y gestión de clientes.
8. **Reportes** — inteligencia de negocio: ventas diarias, por categoría, por método de pago, por cajero, top productos. **Filtros por rango de fecha** y **exportación a PDF / Excel (CSV)**.
9. **Base de Datos** — diagrama Entidad–Relación interactivo y explorador de todas las tablas con datos reales (ideal para la defensa).
10. **Usuarios y roles (RBAC)** — control de acceso basado en roles.

### ✨ Extras (premium)

- **Asistente / chatbot offline** — botón flotante; responde en lenguaje natural sobre ventas, stock, productos, etc. consultando la BD en tiempo real, sin internet ni claves.
- **Búsqueda global (Ctrl + K)** — paleta de comandos para saltar a cualquier módulo o encontrar productos, clientes y ventas.
- **Modo oscuro** y diseño totalmente **responsivo**.
- **Impresión de recibos** en el punto de venta.

### Explorar la base de datos directamente

```bash
npx prisma studio   # o doble clic en VER_BASE_DE_DATOS.bat  → http://localhost:5555
```

---

## 🏗️ Arquitectura / Tecnologías

| Capa            | Tecnología                                       |
|-----------------|--------------------------------------------------|
| Frontend / SSR  | **Next.js 16** (App Router) + **React 19**       |
| Lenguaje        | **TypeScript**                                   |
| Estilos         | **Tailwind CSS 4**                               |
| Base de datos   | **SQLite** vía **Prisma ORM** (portable a MySQL) |
| Autenticación   | Sesión JWT (jose) + middleware (RBAC)            |
| Gráficos        | Recharts                                         |
| Iconos          | lucide-react                                     |

- **Lógica de negocio en transacciones** (`prisma.$transaction`): cada venta descuenta stock y registra el kardex de forma atómica; cada compra lo incrementa.
- **Modelo de datos** (11 entidades): Rol, Usuario, Categoría, Proveedor, Producto, Cliente, Venta, DetalleVenta, Compra, DetalleCompra, MovimientoInventario.

---

## 🔄 Restaurar los datos de demostración

```bash
node prisma/seed.mjs
```

> Si reinicias los datos **mientras tienes sesión abierta**, cierra sesión y vuelve a entrar.

---

## 📁 Estructura

```
minimarket-pos/
├── prisma/
│   ├── schema.prisma     # modelo de datos
│   ├── seed.mjs          # datos de demostración
│   └── dev.db            # base de datos SQLite
├── src/
│   ├── app/              # rutas (App Router) + server actions
│   ├── components/       # componentes de UI
│   └── lib/              # prisma, auth, sesión, utilidades
└── INICIAR_SISTEMA.bat   # lanzador rápido
```
