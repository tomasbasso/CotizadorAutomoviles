import { FRANQUICIAS_SUGERIDAS } from "./planes";

export type Periodo = "mes" | "cuatrimestre" | "semestre" | "año";

export const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: "mes", texto: "por mes" },
  { valor: "cuatrimestre", texto: "por cuatrimestre" },
  { valor: "semestre", texto: "por semestre" },
  { valor: "año", texto: "por año" },
];

export type Opcion = {
  id: string;
  plan: string;
  /** Lo que tipeó el productor, normalizado: dígitos y como mucho una coma decimal. */
  precio: string;
  /** Porcentaje de la suma asegurada ("2,5%"). */
  franquicia: string;
  /** Monto de la franquicia en pesos, normalizado igual que el precio. */
  franquiciaMonto: string;
  recomendada: boolean;
};

export type Cotizacion = {
  numero: string;
  fecha: Date;
  cliente: string;
  vehiculo: string;
  anio: string;
  periodo: Periodo;
  opciones: Opcion[];
};

export const MAX_OPCIONES = 3;

/** Deja solo dígitos y una coma decimal con hasta 2 decimales. */
export function normalizarPrecio(entrada: string): string {
  const limpio = entrada.replace(/[^\d,]/g, "");
  const [entero = "", ...resto] = limpio.split(",");
  const enteroSinCeros = entero.replace(/^0+(?=\d)/, "");
  if (resto.length === 0) return enteroSinCeros;
  return `${enteroSinCeros},${resto.join("").slice(0, 2)}`;
}

/** "85432,5" → "85.432,5" (para mostrar mientras se tipea). */
export function precioParaInput(precio: string): string {
  if (!precio) return "";
  const [entero, decimales] = precio.split(",");
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimales === undefined ? conPuntos : `${conPuntos},${decimales}`;
}

/** "85432,5" → "$ 85.432,50"; "85432" → "$ 85.432" */
export function precioParaMostrar(precio: string): string {
  if (!precio) return "";
  const numero = Number(precio.replace(",", "."));
  if (!Number.isFinite(numero)) return "";
  const decimales = Number.isInteger(numero) ? 0 : 2;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
    .format(numero)
    .replace(/ /g, " ");
}

export function textoFranquicia(franquicia: string): string {
  const valor = franquicia.trim();
  if (!valor) return "";
  const esPorcentaje = /^\d+(,\d+)?\s?%$/.test(valor) || FRANQUICIAS_SUGERIDAS.includes(valor);
  return esPorcentaje ? `${valor.replace(/\s/g, "")} de la suma asegurada` : valor;
}

/** Lo que se imprime de la franquicia: el monto en pesos y/o el porcentaje sobre la suma asegurada. */
export function franquiciaParaMostrar(o: Pick<Opcion, "franquicia" | "franquiciaMonto">) {
  const monto = Number(o.franquiciaMonto.replace(",", ".")) > 0 ? precioParaMostrar(o.franquiciaMonto) : "";
  const porcentaje = textoFranquicia(o.franquicia);
  return monto || porcentaje ? { monto, porcentaje } : null;
}

export function textoPeriodo(periodo: Periodo): string {
  return PERIODOS.find((p) => p.valor === periodo)?.texto ?? "";
}

export function numeroCotizacion(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}${dos(fecha.getMonth() + 1)}${dos(fecha.getDate())}-${dos(fecha.getHours())}${dos(fecha.getMinutes())}`;
}

export function fechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export function nombreArchivo(c: Cotizacion): string {
  const cliente = c.cliente
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `Cotizacion-La-Segunda-${cliente || "cliente"}-${c.numero}.pdf`;
}

/** Lo que falta para poder entregar el PDF, en palabras del productor. */
export function faltantes(c: Pick<Cotizacion, "cliente" | "vehiculo" | "opciones">): string[] {
  const lista: string[] = [];
  if (!c.cliente.trim()) lista.push("el nombre del cliente");
  if (!c.vehiculo.trim()) lista.push("el vehículo");
  if (c.opciones.length === 0) lista.push("al menos un plan");
  c.opciones.forEach((o, i) => {
    if (!o.precio || Number(o.precio.replace(",", ".")) <= 0) lista.push(`el precio de la opción ${i + 1}`);
  });
  return lista;
}
