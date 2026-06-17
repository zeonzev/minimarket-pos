// Aplica variantes dark: a los componentes de página (tablas/formularios) de forma segura.
// Ejecutar UNA sola vez.
import fs from "fs";
import path from "path";

const root = process.cwd();
const files = [
  "src/app/(app)/page.tsx",
  "src/app/(app)/reportes/page.tsx",
  "src/components/productos/ProductosClient.tsx",
  "src/components/clientes/ClientesClient.tsx",
  "src/components/inventario/InventarioClient.tsx",
  "src/components/compras/ComprasClient.tsx",
  "src/components/ventas/VentasClient.tsx",
  "src/components/usuarios/UsuariosClient.tsx",
  "src/components/pos/PosClient.tsx",
  "src/components/reportes/ReportesView.tsx",
];

// Orden importa: patrones más específicos primero.
const repl = [
  ["hover:bg-slate-50/60", "hover:bg-slate-50/60 dark:hover:bg-slate-700/30"],
  ["bg-slate-50 text-left", "bg-slate-50 text-left dark:bg-slate-900/40"],
  ["divide-slate-50", "divide-slate-100 dark:divide-slate-700/60"],
  ["text-slate-900", "text-slate-900 dark:text-slate-100"],
  ["text-slate-800", "text-slate-800 dark:text-slate-100"],
  ["text-slate-700", "text-slate-700 dark:text-slate-200"],
  ["border-slate-100", "border-slate-100 dark:border-slate-700"],
  ["border-slate-200", "border-slate-200 dark:border-slate-700"],
  ["bg-white", "bg-white dark:bg-slate-800"],
];

for (const rel of files) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) {
    console.log("SKIP (no existe):", rel);
    continue;
  }
  let src = fs.readFileSync(fp, "utf8");
  if (src.includes("dark:")) {
    console.log("YA TIENE dark:, lo salto ->", rel);
    continue;
  }
  let count = 0;
  for (const [from, to] of repl) {
    const before = src;
    src = src.split(from).join(to);
    if (src !== before) count++;
  }
  fs.writeFileSync(fp, src, "utf8");
  console.log(`OK (${count} patrones) -> ${rel}`);
}
console.log("Listo.");
