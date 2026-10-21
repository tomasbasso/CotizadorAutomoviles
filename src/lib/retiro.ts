import datos from "../../datos/retiro.json";
import { paraArchivo } from "./cotizacion";

/**
 * Réplica del cálculo del cotizador público de Retiro de La Segunda
 * (lasegundaonline.com.ar/cotizacion-online/retiro), con una diferencia: el sitio
 * solo descuenta de cada aporte la tasa SSN (0,6 %), y acá se descuentan también
 * los gastos administrativos y el sellado que informa la hoja del plan para agencias.
 */

export type Moneda = "ARS" | "USD";
export type Sexo = "F" | "M" | "X";

export type DatosRetiro = {
  fechaNacimiento: Date;
  sexo: Sexo;
  moneda: Moneda;
  aporteMensual: number;
  edadRetiro: number;
};

export type ResultadoRetiro = {
  fondosAcumulados: number;
  rentaMensual: number;
  mesesDeAporte: number;
};

export const PARAMETROS_RETIRO = datos.parametros;
export const TEXTOS_RETIRO = datos.textos;
export const RELEVADO_RETIRO = datos.relevado;
export const RENDIMIENTO_CARTERA = datos.rendimientoCartera;

const FACTORES = datos.factoresRenta.porEdad as Record<
  string,
  Record<Moneda, { M: number; F: number }>
>;

/**
 * Edad en meses tomada al 1° del mes que viene, como hace el sitio.
 * Si no nació el día 1, se descuenta un mes.
 */
export function edadEnMeses(fechaNacimiento: Date, hoy = new Date()): number {
  const referencia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  let meses =
    (referencia.getFullYear() - fechaNacimiento.getFullYear()) * 12 +
    referencia.getMonth() -
    fechaNacimiento.getMonth();
  if (referencia.getDate() < fechaNacimiento.getDate()) meses -= 1;
  return meses;
}

/** Años cumplidos a hoy. */
export function edadEnAnios(fechaNacimiento: Date, hoy = new Date()): number {
  let anios = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const yaCumplio =
    hoy.getMonth() > fechaNacimiento.getMonth() ||
    (hoy.getMonth() === fechaNacimiento.getMonth() &&
      hoy.getDate() >= fechaNacimiento.getDate());
  if (!yaCumplio) anios -= 1;
  return anios;
}

/** El sitio pide retirarse al menos 5 años después de la edad actual. */
export function edadMinimaRetiro(fechaNacimiento: Date, hoy = new Date()): number {
  return edadEnAnios(fechaNacimiento, hoy) + 5;
}

/** Capital necesario por cada $1 (o USD 1) de renta mensual. X usa la tabla de M. */
export function factorRenta(edadRetiro: number, moneda: Moneda, sexo: Sexo): number {
  const fila = FACTORES[String(edadRetiro)];
  if (!fila) throw new Error(`No hay factor de renta para ${edadRetiro} años`);
  return sexo === "F" ? fila[moneda].F : fila[moneda].M;
}

/** Tasa SSN + gastos administrativos + sellado, como fracción del aporte (0,016 = 1,6 %). */
export function gastosSobreAporte(moneda: Moneda): number {
  const g = PARAMETROS_RETIRO.gastosSobreAporte;
  return g.tasaSSN + g.administrativos[moneda] + g.sellado;
}

export function calcularRetiro(
  { fechaNacimiento, sexo, moneda, aporteMensual, edadRetiro }: DatosRetiro,
  hoy = new Date(),
): ResultadoRetiro {
  const tasaAnual = PARAMETROS_RETIRO.tasaProyeccion[moneda];
  const mesesDeAporte = edadRetiro * 12 - edadEnMeses(fechaNacimiento, hoy);

  // Valor futuro de aportes mensuales adelantados, capitalizados a la tasa
  // mensual equivalente de la tasa anual de proyección.
  const crecimiento = Math.pow(1 + tasaAnual, mesesDeAporte / 12) - 1;
  const tasaMensual = Math.pow(1 + tasaAnual, 1 / 12) - 1;
  const factorAcumulacion = (crecimiento / tasaMensual) * (1 + tasaMensual);

  // Antes de invertirlo, a cada aporte se le descuentan los gastos (el sitio divide por 1,006).
  const fondosAcumulados = (aporteMensual / (1 + gastosSobreAporte(moneda))) * factorAcumulacion;
  const rentaMensual = fondosAcumulados / factorRenta(edadRetiro, moneda, sexo);

  return { fondosAcumulados, rentaMensual, mesesDeAporte };
}

// ——— Cotización que arma el productor ———

export type Escenario = {
  id: string;
  /** Aporte mensual tipeado, solo dígitos. */
  aporte: string;
  /** Edad de retiro tipeada, solo dígitos. */
  edadRetiro: string;
  recomendada: boolean;
};

export type CotizacionRetiro = {
  numero: string;
  fecha: Date;
  cliente: string;
  /** Fecha de nacimiento como se tipeó: "dd/mm/aaaa". */
  nacimiento: string;
  sexo: Sexo | "";
  moneda: Moneda;
  escenarios: Escenario[];
};

export const MAX_ESCENARIOS = 3;
export const EDAD_RETIRO_SUGERIDA = 65;

export const SEXOS: { valor: Sexo; texto: string }[] = [
  { valor: "F", texto: "F" },
  { valor: "M", texto: "M" },
  { valor: "X", texto: "X" },
];

export const MONEDAS: { valor: Moneda; texto: string }[] = [
  { valor: "ARS", texto: "Pesos" },
  { valor: "USD", texto: "Dólares" },
];

/** Mientras se tipea: deja solo dígitos y pone las barras ("15031990" → "15/03/1990"). */
export function formatearNacimiento(entrada: string): string {
  const d = entrada.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "15/03/1990" → fecha. Devuelve null si está incompleta, no existe o es futura. */
export function leerNacimiento(texto: string, hoy = new Date()): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(anio, mes - 1, dia);
  const existe = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  if (!existe || anio < 1900 || fecha > hoy) return null;
  return fecha;
}

export type EstadoNacimiento =
  | { tipo: "vacia" | "incompleta" | "invalida" }
  | { tipo: "fuera-de-rango"; edad: number }
  | { tipo: "ok"; fecha: Date; edad: number };

export function estadoNacimiento(texto: string, hoy = new Date()): EstadoNacimiento {
  if (!texto) return { tipo: "vacia" };
  if (texto.length < 10) return { tipo: "incompleta" };
  const fecha = leerNacimiento(texto, hoy);
  if (!fecha) return { tipo: "invalida" };
  const edad = edadEnAnios(fecha, hoy);
  const { minima, maxima } = PARAMETROS_RETIRO.edadContratacion;
  if (edad < minima || edad > maxima) return { tipo: "fuera-de-rango", edad };
  return { tipo: "ok", fecha, edad };
}

export function rangoEdadRetiro(nacimiento: Date | null, hoy = new Date()) {
  const maxima = PARAMETROS_RETIRO.edadMaximaRetiro;
  const minima = nacimiento ? edadMinimaRetiro(nacimiento, hoy) : PARAMETROS_RETIRO.edadContratacion.minima;
  return { minima, maxima };
}

/** Edad sugerida para una opción nueva: 65, o la mínima posible si el cliente ya está cerca. */
export function edadRetiroSugerida(nacimiento: Date | null, hoy = new Date()): number {
  const { minima, maxima } = rangoEdadRetiro(nacimiento, hoy);
  return Math.min(Math.max(EDAD_RETIRO_SUGERIDA, minima), maxima);
}

export function limitesAporte(moneda: Moneda) {
  return PARAMETROS_RETIRO.aporteMensual[moneda];
}

export type EstadoEscenario =
  | { tipo: "sin-aporte" | "sin-edad" }
  | { tipo: "aporte-fuera-de-rango"; minimo: number; maximo: number }
  | { tipo: "edad-fuera-de-rango"; minima: number; maxima: number }
  | { tipo: "faltan-datos" }
  | { tipo: "ok"; aporte: number; edadRetiro: number; resultado: ResultadoRetiro; totalAportado: number };

/** Revisa una opción y, si está todo, la calcula. */
export function estadoEscenario(
  c: Pick<CotizacionRetiro, "nacimiento" | "sexo" | "moneda">,
  e: Escenario,
  hoy = new Date(),
): EstadoEscenario {
  const nacimiento = estadoNacimiento(c.nacimiento, hoy);
  const fecha = nacimiento.tipo === "ok" ? nacimiento.fecha : null;
  const aporte = Number(e.aporte);
  const edadRetiro = Number(e.edadRetiro);
  const { minimo, maximo } = limitesAporte(c.moneda);
  const rango = rangoEdadRetiro(fecha, hoy);

  if (!e.aporte || aporte <= 0) return { tipo: "sin-aporte" };
  if (aporte < minimo || aporte > maximo) return { tipo: "aporte-fuera-de-rango", minimo, maximo };
  if (!e.edadRetiro) return { tipo: "sin-edad" };
  if (edadRetiro < rango.minima || edadRetiro > rango.maxima) return { tipo: "edad-fuera-de-rango", ...rango };
  if (!fecha || !c.sexo) return { tipo: "faltan-datos" };

  const resultado = calcularRetiro(
    { fechaNacimiento: fecha, sexo: c.sexo, moneda: c.moneda, aporteMensual: aporte, edadRetiro },
    hoy,
  );
  return { tipo: "ok", aporte, edadRetiro, resultado, totalAportado: aporte * resultado.mesesDeAporte };
}

/**
 * Lo que falta para poder entregar el PDF. Para el productor el nombre es obligatorio;
 * en el simulador para clientes es opcional y los textos le hablan al cliente ("tu fecha").
 */
export function faltantesRetiro(
  c: Omit<CotizacionRetiro, "numero" | "fecha">,
  hoy = new Date(),
  { paraCliente = false } = {},
): string[] {
  const lista: string[] = [];
  if (!paraCliente && !c.cliente.trim()) lista.push("el nombre del cliente");
  const nacimiento = estadoNacimiento(c.nacimiento, hoy);
  const fecha = paraCliente ? "tu fecha de nacimiento" : "la fecha de nacimiento";
  if (nacimiento.tipo === "vacia") lista.push(fecha);
  else if (nacimiento.tipo !== "ok") lista.push(`corregir ${fecha}`);
  if (!c.sexo) lista.push("el sexo");
  if (c.escenarios.length === 0) lista.push("al menos una opción");
  c.escenarios.forEach((e, i) => {
    const estado = estadoEscenario(c, e, hoy);
    const n = i + 1;
    if (estado.tipo === "sin-aporte") lista.push(`el aporte de la opción ${n}`);
    if (estado.tipo === "aporte-fuera-de-rango") lista.push(`corregir el aporte de la opción ${n}`);
    if (estado.tipo === "sin-edad") lista.push(`la edad de retiro de la opción ${n}`);
    if (estado.tipo === "edad-fuera-de-rango") lista.push(`corregir la edad de retiro de la opción ${n}`);
  });
  return lista;
}

export function simboloMoneda(moneda: Moneda): string {
  return moneda === "ARS" ? "$" : "USD";
}

/** 9079.75 → "$ 9.080"; en dólares, "USD 176". Sin decimales, como el sitio. */
export function montoParaMostrar(monto: number, moneda: Moneda): string {
  const numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(monto));
  return `${simboloMoneda(moneda)} ${numero}`;
}

/** 53 → "4 años y 5 meses". */
export function textoPlazo(meses: number): string {
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [
    anios > 0 && `${anios} ${anios === 1 ? "año" : "años"}`,
    resto > 0 && `${resto} ${resto === 1 ? "mes" : "meses"}`,
  ].filter(Boolean);
  return partes.join(" y ");
}

export function textoMoneda(moneda: Moneda): string {
  return moneda === "ARS" ? "en pesos" : "en dólares";
}

/** 0.2 → "20 %"; 0.3954 → "39,54 %". Con dosDecimales, 0.029 → "2,90 %" (como el informe de rendimientos). */
export function textoPorcentaje(fraccion: number, dosDecimales = false): string {
  const formato = new Intl.NumberFormat("es-AR", { minimumFractionDigits: dosDecimales ? 2 : 0, maximumFractionDigits: 2 });
  return `${formato.format(fraccion * 100)} %`;
}

export function textoTasa(moneda: Moneda): string {
  return textoPorcentaje(PARAMETROS_RETIRO.tasaProyeccion[moneda]);
}

export function textoTasaGarantizada(moneda: Moneda): string {
  const tasa = textoPorcentaje(PARAMETROS_RETIRO.tasaGarantizada[moneda]);
  return moneda === "ARS" ? `${tasa} anual o la tasa testigo de la SSN, la que sea mayor` : `${tasa} anual`;
}

/** "0,6 % de tasa SSN y 1 % de gastos administrativos" (más el sellado, si hay). */
export function detalleGastos(moneda: Moneda): string {
  const g = PARAMETROS_RETIRO.gastosSobreAporte;
  const partes = [
    `${textoPorcentaje(g.tasaSSN)} de tasa SSN`,
    `${textoPorcentaje(g.administrativos[moneda])} de gastos administrativos`,
    g.sellado > 0 && `${textoPorcentaje(g.sellado)} de sellado`,
  ].filter(Boolean);
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

/** "hasta 8 % el primer año, 3 % hasta los 4 años, 1 % hasta los 10 años y nada después". */
export function textoQuitas(): string {
  const tramos = PARAMETROS_RETIRO.rescates.quitasPorAntiguedad.map((q, i) => {
    const quita = Math.max(q.larga, q.corta);
    if (q.hastaMeses === null) return quita === 0 ? "nada después" : `${textoPorcentaje(quita)} después`;
    const plazo = q.hastaMeses === 12 ? "el primer año" : `hasta los ${q.hastaMeses / 12} años`;
    return `${i === 0 ? "hasta " : ""}${textoPorcentaje(quita)} ${plazo}`;
  });
  return `${tramos.slice(0, -1).join(", ")} y ${tramos.at(-1)}`;
}

export function nombreArchivoRetiro(c: CotizacionRetiro): string {
  const nombre = paraArchivo(c.cliente);
  return `Retiro-La-Segunda-${nombre ? `${nombre}-` : ""}${c.numero}.pdf`;
}
