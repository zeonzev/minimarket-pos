/** Formatea un número como moneda boliviana: 1234.5 -> "Bs 1,234.50" */
export function formatBs(n: number | null | undefined): string {
  const v = n ?? 0;
  const s = Math.abs(v).toFixed(2);
  const [int, dec] = s.split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${v < 0 ? "-" : ""}Bs ${withSep}.${dec}`;
}

/** Número con separador de miles: 1234 -> "1,234" */
export function formatNum(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("en-US");
}

/** Une clases condicionalmente (mini clsx). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Fecha corta: "12 jun 2026" */
export function formatFecha(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MESES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Fecha + hora: "12 jun, 14:35" */
export function formatFechaHora(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MESES[date.getMonth()]}, ${hh}:${mm}`;
}

/** Hora HH:MM */
export function formatHora(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

/** Iniciales para avatar */
export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
