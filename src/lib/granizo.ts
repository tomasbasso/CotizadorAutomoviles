import datos from "../../datos/granizo.json";
import { paraArchivo } from "./cotizacion";

/**
 * Cotizador de Granizo para Cosecha Gruesa 2026/27.
 * Tasas, recargos, resiembras y vigencias de la circular 02/2026 de La Segunda,
 * calibrado con una cotización real del sistema de propuestas (ver `calibracion` en datos/granizo.json).
 * El número que vale es el del sistema: esto es orientativo.
 */

export type Cultivo = "g" | "m" | "s";
export type Plan = "g" | "v" | "h";
export type Moneda = "ars" | "qq" | "usd";
export type Pago = "contado" | "2080" | "100" | "canje";
export type Paralelo = "sur" | "norte";
export type Resiembra = "ce" | "cep" | "20" | "20p" | "30p";

type Fila = { p: string; d: string; fo: number | null; r: (number | null)[]; qq: (number | null)[] | null; revisar?: boolean };
type Recargo = number[] | Record<string, number[]>;

const GRANIZO = datos.granizo as Fila[];
const VIENTO = datos.viento as Fila[];
const HELADA = datos.helada as Fila[];
const TABLA_PLAN: Record<Plan, Fila[]> = { g: GRANIZO, v: VIENTO, h: HELADA };
const RECARGOS = datos.recargos as unknown as Record<Pago, Record<string, Recargo>>;
export const FUENTE_GRANIZO = datos.fuente;

export type CotizacionGranizo = {
  numero: string;
  fecha: Date;
  cliente: string;
  provincia: string;
  /** Índice de la fila en las tablas de tasas. */
  depto: string;
  paralelo: Paralelo;
  condicion: string;
  iibb: string;
  cultivo: Cultivo;
  plan: Plan;
  /** dd/mm/aaaa */
  siembra: string;
  moneda: Moneda;
  hectareas: string;
  valorHa: string;
  qqHa: string;
  rinde: string;
  precioQq: string;
  franquicia: string;
  resiembra: Resiembra;
  pago: Pago;
  planchado: boolean;
  planchadoPrimera: boolean;
  planchadoSuelo: boolean;
  planchadoTasa: string;
  /** Tuvo póliza la campaña pasada: la carencia es de 3 días sin costo. */
  polizaPrevia: boolean;
  /** Cliente nuevo que paga la reducción de carencia a 3 días (+10%). Sin póliza previa ni reducción, son 5 días. */
  reduccionCarencia: boolean;
  /** Descuento que resigna la agencia, en % sobre la tasa. */
  descuentoAgencia: string;
  /** Descuento que da La Segunda, en % sobre la tasa. */
  descuentoLaSegunda: string;
};

export type DatosGranizo = Omit<CotizacionGranizo, "numero" | "fecha">;

export const CULTIVOS: { valor: Cultivo; texto: string }[] = [
  { valor: "g", texto: "Girasol" },
  { valor: "m", texto: "Maíz" },
  { valor: "s", texto: "Soja" },
];
export const PLANES: { valor: Plan; texto: string; corto: string }[] = [
  { valor: "g", texto: "Granizo e Incendio", corto: "Granizo" },
  { valor: "v", texto: "Granizo, Incendio y Viento", corto: "+ Viento" },
  { valor: "h", texto: "Granizo, Incendio, Viento y Helada", corto: "+ Viento y Helada" },
];
export const MONEDAS: { valor: Moneda; texto: string }[] = [
  { valor: "ars", texto: "Pesos" },
  { valor: "qq", texto: "Quintales" },
  { valor: "usd", texto: "Dólares" },
];
export const PAGOS: { valor: Pago; texto: string; corto: string }[] = [
  { valor: "contado", texto: "Contado", corto: "Contado" },
  { valor: "2080", texto: "20% contado / 80% fin de cosecha", corto: "20 / 80" },
  { valor: "100", texto: "100% fin de cosecha", corto: "100% cosecha" },
  { valor: "canje", texto: "Plan Canje", corto: "Canje" },
];
export const RESIEMBRAS: { valor: Resiembra; texto: string; ajuste: string; factor: number }[] = [
  { valor: "ce", texto: "Ciclo Evolutivo", ajuste: "tasa base", factor: 1 },
  { valor: "cep", texto: "Ciclo Evolutivo Plus", ajuste: "+15%", factor: 1.15 },
  { valor: "20", texto: "20% Suma Asegurada", ajuste: "−10%", factor: 0.9 },
  { valor: "20p", texto: "20% Suma Asegurada Plus", ajuste: "−5%", factor: 0.95 },
  { valor: "30p", texto: "30% Suma Asegurada Plus", ajuste: "tasa base", factor: 1 },
];

const COND_STD: [string, string][] = [
  ["1", "Responsable Inscripto (con percepción IVA)"],
  ["0b", "Responsable Inscripto con certificado de exclusión"],
  ["0", "Monotributo"],
  ["2", "No categorizado"],
];
const COND_CANJE: [string, string][] = [
  ["0", "RI inscripto en el Registro de Operadores"],
  ["1", "RI no inscripto en el Registro de Operadores"],
];
const DECREC_PROV = ["Chaco", "Santa Fe", "Entre Ríos", "Santiago del Estero", "Buenos Aires"];
const DECREC_DEPT: Record<string, string[]> = {
  "La Pampa": ["ATREU-CO", "CATRILO", "CHAPALEUFU", "GUATRACHE", "HUCAL", "MARACO", "QUEMU QUEMU"],
  Córdoba: ["MARCOS JUÁREZ", "SAN JUSTO", "UNION"],
};
const CBA_SA20 = ["RÍO CUARTO", "JUÁREZ CELMAN", "GENERAL ROCA", "ROQUE SAENZ PEÑA", "CALAMUCHITA", "GENERAL SAN MARTÍN", "TERCERO ARRIBA"];
const CBA_NND6 = ["RÍO PRIMERO", "ROQUE SAENZ PEÑA", "GENERAL SAN MARTÍN"];
const CBA_MAIZ_SUR = ["RÍO CUARTO", "ROQUE SAENZ PEÑA", "GENERAL ROCA"];
const GIR_NORTE: Record<string, string[] | null> = {
  Chaco: null,
  "Santiago del Estero": null,
  Córdoba: ["SAN JUSTO"],
  "Santa Fe": ["NUEVE DE JULIO", "CASTELLANOS", "GARAY", "GENERAL OBLIGADO", "CAPITAL", "LAS COLONIAS", "SAN CRISTOBAL", "SAN JAVIER", "SAN JUSTO", "VERA"],
};
/** Franquicia 5% en zonas de franquicia obligatoria: ajuste medido con la cotización real de Conhelo (girasol). */
const F5_EN_OBLIGATORIA = datos.calibracion.prima / (datos.calibracion.sumaAsegurada * (datos.calibracion.tasaBase / 100));
const COLUMNA_CULTIVO: Record<Cultivo, number> = { g: 0, m: 1, s: 2 };

const empiezaCon = (d: string, lista: string[]) => lista.some((x) => d.startsWith(x));
const D = (a: number, m: number, d: number) => new Date(a, m - 1, d);
const sumarDias = (f: Date, n: number) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);
const soloDia = (f: Date) => new Date(f.getFullYear(), f.getMonth(), f.getDate());
/** "1.234,5" o "1234,5" → 1234.5 */
export const leerNumero = (texto: string) => Number(texto.replace(/\./g, "").replace(",", ".")) || 0;

// ---------- Opciones que dependen de lo elegido ----------

export const PROVINCIAS = [...new Set(GRANIZO.map((f) => f.p))];

export function departamentos(provincia: string): { valor: string; texto: string }[] {
  return GRANIZO.flatMap((f, i) => (f.p === provincia ? [{ valor: String(i), texto: titulo(f.d) }] : []));
}

export function opcionesIibb(provincia: string): { valor: string; texto: string }[] {
  if (provincia === "Buenos Aires")
    return [
      { valor: "min", texto: "Inscripto o no inscripto, mínimo ARBA" },
      { valor: "max", texto: "Inscripto o no inscripto, máximo ARBA" },
      { valor: "ex", texto: "Exento" },
    ];
  if (provincia === "San Luis")
    return [
      { valor: "ins", texto: "Inscripto o no inscripto" },
      { valor: "ex", texto: "Exento" },
    ];
  return [];
}

export function opcionesCondicion(pago: Pago) {
  return (pago === "canje" ? COND_CANJE : COND_STD).map(([valor, texto]) => ({ valor, texto }));
}

export function opcionesFranquicia(depto: string, plan: Plan): { valor: string; texto: string }[] {
  const f = GRANIZO[Number(depto)];
  if (!f) return [];
  const o: { valor: string; texto: string }[] = [];
  if (f.fo) {
    // La obligatoria va primero: es la que usa el sistema si no se pide otra.
    o.push({ valor: "fo", texto: `${f.fo}% deducible sobre el área (obligatoria en la zona)` });
    if (plan === "g") o.push({ valor: "5o", texto: "5% deducible sobre el área (con recargo)" });
    if (f.p === "Córdoba" && empiezaCon(f.d, CBA_NND6) && plan === "g")
      o.push({ valor: "nnd6x", texto: "6% no deducible (+10% de extra prima)" });
  } else {
    o.push({ valor: "5", texto: "5% deducible sobre el área" }, { valor: "6", texto: "6% fija no deducible" });
    const decreciente = plan === "g" && (DECREC_PROV.includes(f.p) || empiezaCon(f.d, DECREC_DEPT[f.p] ?? []));
    if (decreciente)
      o.push(
        { valor: "d10", texto: "Deducible decreciente 10% (−20%)" },
        { valor: "d20", texto: "Deducible decreciente 20% (−34%)" },
      );
  }
  return o;
}

/** Quién no cubre el paralelo 36: la soja no cambia y toda La Pampa es zona sur. */
export const pideParalelo = (d: Pick<DatosGranizo, "cultivo" | "provincia">) => d.cultivo !== "s" && d.provincia !== "La Pampa";

/** Corrige lo que dejó de tener sentido después de un cambio (por ejemplo, canje con girasol). */
export function normalizar(d: DatosGranizo): DatosGranizo {
  const n = { ...d };
  const deptos = departamentos(n.provincia);
  if (!deptos.some((x) => x.valor === n.depto)) n.depto = deptos[0]?.valor ?? "";
  if (n.provincia === "La Pampa") n.paralelo = "sur";
  if (n.cultivo === "g" && n.pago === "canje") n.pago = "100";
  if (n.pago === "canje") n.moneda = "qq";
  if (n.moneda === "qq" && n.pago === "contado") n.pago = "100";
  const iibb = opcionesIibb(n.provincia);
  if (iibb.length && !iibb.some((x) => x.valor === n.iibb)) n.iibb = iibb[0].valor;
  const cond = opcionesCondicion(n.pago);
  if (!cond.some((x) => x.valor === n.condicion)) n.condicion = cond[0].valor;
  const fq = opcionesFranquicia(n.depto, n.plan);
  if (!fq.some((x) => x.valor === n.franquicia)) n.franquicia = fq[0]?.valor ?? "";
  return n;
}

export const pagoDeshabilitado = (d: DatosGranizo, pago: Pago) =>
  (pago === "canje" && d.cultivo === "g") || (pago === "contado" && d.moneda === "qq");
export const monedaDeshabilitada = (d: DatosGranizo, moneda: Moneda) => d.pago === "canje" && moneda !== "qq";

export function datosInicialesGranizo(): DatosGranizo {
  const conhelo = GRANIZO.findIndex((f) => f.p === "La Pampa" && f.d === "CONHELO");
  return normalizar({
    cliente: "",
    provincia: "La Pampa",
    depto: String(conhelo),
    paralelo: "sur",
    condicion: "1",
    iibb: "",
    cultivo: "g",
    plan: "g",
    siembra: "",
    moneda: "ars",
    hectareas: "",
    valorHa: "",
    qqHa: "",
    rinde: "",
    precioQq: "",
    franquicia: "",
    resiembra: "ce",
    pago: "100",
    planchado: false,
    planchadoPrimera: true,
    planchadoSuelo: true,
    planchadoTasa: "",
    polizaPrevia: true,
    reduccionCarencia: false,
    descuentoAgencia: "",
    descuentoLaSegunda: "",
  });
}

// ---------- Fechas ----------

export function formatearFecha(entrada: string): string {
  const d = entrada.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function leerFecha(texto: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(anio, mes - 1, dia);
  return f.getDate() === dia && f.getMonth() === mes - 1 ? f : null;
}

export const fechaCorta = (f: Date | null) =>
  f ? f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

function finVigencia(d: DatosGranizo, f: Fila, siembra: Date | null): [Date | null, string] {
  if (d.cultivo === "g") {
    const norte = f.p in GIR_NORTE && (GIR_NORTE[f.p] === null || empiezaCon(f.d, GIR_NORTE[f.p] ?? []));
    if (!norte) return [D(2027, 4, 30), "girasol, resto del país"];
    if (!siembra) return [null, "falta la fecha de siembra"];
    return siembra <= D(2026, 9, 15)
      ? [D(2027, 1, 31), "girasol sembrado hasta el 15/09"]
      : [D(2027, 2, 28), "girasol sembrado desde el 16/09"];
  }
  if (d.cultivo === "s") {
    if (f.p === "Chaco" && siembra && siembra.getMonth() >= 8 && siembra.getMonth() <= 9)
      return [D(2027, 1, 31), "soja en Chaco sembrada en septiembre u octubre"];
    return [D(2027, 5, 31), "soja"];
  }
  const sur = d.paralelo === "sur" || (f.p === "Córdoba" && empiezaCon(f.d, CBA_MAIZ_SUR));
  if (!siembra) return [null, "falta la fecha de siembra"];
  if (sur || siembra >= D(2026, 12, 1)) return [D(2027, 6, 30), "maíz, extensible sin costo al 31/08/2027"];
  return [D(2027, 5, 31), "maíz, extensible sin costo al 31/07/2027"];
}

function limiteViento(d: DatosGranizo, siembra: Date | null): Date | "no" | null {
  if (d.cultivo === "g") return d.paralelo === "sur" ? D(2026, 12, 31) : D(2026, 11, 30);
  if (!siembra) return null;
  if (d.cultivo === "m") {
    if (siembra <= D(2026, 10, 31)) return D(2026, 11, 30);
    if (siembra <= D(2026, 12, 14)) return D(2026, 12, 31);
    return "no";
  }
  return siembra <= D(2026, 11, 30) ? D(2026, 12, 31) : "no";
}

// ---------- Cálculo ----------

export type Aviso = { tipo: "error" | "alerta" | "info"; texto: string };

export type ResultadoGranizo = {
  tipo: "ok";
  fila: { provincia: string; depto: string };
  lineas: [string, string][];
  tasaFinal: number;
  sumaAsegurada: number;
  porHa: number;
  prima: number;
  recargo: number | null;
  premio: number;
  inicio: Date;
  inicioViento: Date | null;
  fin: Date | null;
  notaFin: string;
  maizTardio: boolean;
  avisos: Aviso[];
};

export type EstadoGranizo =
  | ResultadoGranizo
  | { tipo: "faltan-datos"; falta: string[] }
  | { tipo: "sin-tasa"; texto: string };

const UNIDAD: Record<Moneda, string> = { ars: "$", qq: "qq", usd: "US$" };

export function monto(n: number, moneda: Moneda): string {
  const texto = n.toLocaleString("es-AR", { minimumFractionDigits: moneda === "qq" ? 1 : 2, maximumFractionDigits: moneda === "qq" ? 1 : 2 });
  return moneda === "qq" ? `${texto} qq` : `${UNIDAD[moneda]} ${texto}`;
}
export const porcentaje = (n: number, decimales = 2) =>
  `${n.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}%`;
const num = (n: number, d = 1) => n.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Lo que falta para poder calcular (sin contar el nombre del cliente). */
function faltanParaCalcular(d: DatosGranizo): string[] {
  const falta: string[] = [];
  if (!(leerNumero(d.hectareas) > 0)) falta.push("la superficie");
  if (d.moneda === "qq" ? !(leerNumero(d.qqHa) > 0) : !(leerNumero(d.valorHa) > 0))
    falta.push(d.moneda === "qq" ? "la cantidad de quintales por hectárea" : "el valor por hectárea");
  if (d.siembra && !leerFecha(d.siembra)) falta.push("una fecha de siembra válida");
  return falta;
}

export function calcularGranizo(d: DatosGranizo, ahora = new Date()): EstadoGranizo {
  const falta = faltanParaCalcular(d);
  if (falta.length) return { tipo: "faltan-datos", falta };

  const i = Number(d.depto);
  const f = GRANIZO[i];
  const fila = TABLA_PLAN[d.plan][i];
  if (!f || !fila) return { tipo: "faltan-datos", falta: ["el departamento"] };
  if (f.revisar || fila.revisar)
    return { tipo: "sin-tasa", texto: `Las tasas de ${titulo(f.d)} se cargaron mal de la circular y están en revisión. Cotizalo en el sistema.` };

  const canje = d.pago === "canje";
  const columna = COLUMNA_CULTIVO[d.cultivo] * 2 + (d.franquicia === "5" ? 1 : 0) + (canje ? 6 : 0);
  const base = fila.r[columna];
  if (base == null || base === 0)
    return { tipo: "sin-tasa", texto: "No hay tasa publicada para esta combinación en este departamento. Consultá con la Administración." };

  const avisos: Aviso[] = [];
  const lineas: [string, string][] = [];
  const cultivo = CULTIVOS.find((c) => c.valor === d.cultivo)!.texto;
  const siembra = leerFecha(d.siembra);
  lineas.push([`Tasa ${cultivo} · ${{ g: "granizo", v: "granizo y viento", h: "granizo, viento y helada" }[d.plan]} · ${canje ? "canje" : "pago a cosecha"}`, porcentaje(base)]);

  let t = base;
  const multiplicar = (texto: string, factor: number) => {
    t *= factor;
    lineas.push([texto, `× ${num(factor, 4)}`]);
  };
  if (d.franquicia === "5o") multiplicar("Franquicia 5% deducible (en vez de la obligatoria)", F5_EN_OBLIGATORIA);
  if (d.franquicia === "d10") multiplicar("Franquicia decreciente 10%", 0.8);
  if (d.franquicia === "d20") multiplicar("Franquicia decreciente 20%", 0.66);
  if (d.franquicia === "nnd6x") multiplicar("6% no deducible (extra prima)", 1.1);

  const resiembra = RESIEMBRAS.find((r) => r.valor === d.resiembra)!;
  let factorResiembra = resiembra.factor;
  if (d.resiembra === "20" && f.p === "Córdoba" && empiezaCon(f.d, CBA_SA20)) factorResiembra = 0.8;
  if (factorResiembra !== 1) multiplicar(`Resiembra ${resiembra.texto}`, factorResiembra);

  const maizTardio = d.cultivo === "m" && !!siembra && siembra >= D(2026, 12, 15);
  if (maizTardio) multiplicar("Maíz tardío (siembra desde el 15/12)", 0.8);
  if (!d.polizaPrevia && d.reduccionCarencia) multiplicar("Reducción de carencia, cliente nuevo", 1.1);
  const descuentoAgencia = Math.min(50, Math.max(0, leerNumero(d.descuentoAgencia)));
  const descuentoLaSegunda = Math.min(50, Math.max(0, leerNumero(d.descuentoLaSegunda)));
  // El sistema de La Segunda suma las dos bonificaciones y las aplica juntas sobre la tasa
  // (cotización 39511808: 4% + 10% → 14%, coincide con 0,12% de diferencia; encadenadas darían 0,35%).
  const descuentos = Math.min(50, descuentoAgencia + descuentoLaSegunda);
  if (descuentos) {
    const partes = [
      descuentoAgencia && `agencia ${num(descuentoAgencia)}%`,
      descuentoLaSegunda && `La Segunda ${num(descuentoLaSegunda)}%`,
    ].filter(Boolean);
    multiplicar(`Descuentos: ${partes.join(" + ")}`, 1 - descuentos / 100);
  }
  lineas.push(["Tasa final", porcentaje(t, 4)]);

  let tasaPlanchado = 0;
  if (d.planchado) {
    if (!d.planchadoPrimera)
      avisos.push({ tipo: "error", texto: "Planchado: solo para cultivos de primera, sin cultivo de invierno antes en el lote." });
    if (!d.planchadoSuelo)
      avisos.push({ tipo: "error", texto: "Planchado: solo en suelos clase I, II o III según la carta de suelos del INTA." });
    tasaPlanchado = leerNumero(d.planchadoTasa);
    if (tasaPlanchado) lineas.push(["Extra prima de planchado (sobre la suma asegurada)", `+ ${porcentaje(tasaPlanchado, 3)}`]);
    else avisos.push({ tipo: "alerta", texto: "Planchado sin tasa: cargá la extra prima. El premio todavía no la incluye." });
    const [rastra, resembrar] = { m: [0.75, 6], g: [0.5, 2], s: [0.5, 3] }[d.cultivo];
    avisos.push({
      tipo: "info",
      texto: `Planchado: paga ${num(rastra, 2)} qq/ha si alcanza con rastra rotativa y ${num(resembrar, 0)} qq/ha si hay que resembrar. Cubre desde la siembra hasta que nació todo el lote.`,
    });
  }

  // Recargo financiero e impositivo
  let recargo: number | null = null;
  const tabla = RECARGOS[d.pago][f.p];
  if (tabla) {
    const serie = Array.isArray(tabla) ? tabla : tabla[d.iibb];
    recargo = serie ? (serie[d.condicion === "0b" ? 0 : Number(d.condicion)] ?? null) : null;
  }

  // Suma asegurada y controles del 80% del rinde
  const ha = leerNumero(d.hectareas);
  const rinde = leerNumero(d.rinde);
  const precio = leerNumero(d.precioQq);
  let porHa: number;
  if (d.moneda === "qq") {
    porHa = leerNumero(d.qqHa);
    if (rinde && porHa > rinde * 0.8 + 1e-9)
      avisos.push({ tipo: "error", texto: `Supera el máximo: hasta el 80% del rinde (${num(rinde * 0.8)} qq/ha).` });
    if (porHa < 3) avisos.push({ tipo: "error", texto: "El mínimo a asegurar es 3 qq/ha." });
  } else {
    porHa = leerNumero(d.valorHa);
    if (precio) {
      const q = porHa / precio;
      if (rinde && q > rinde * 0.8 + 1e-9)
        avisos.push({
          tipo: "error",
          texto: `Supera el máximo: ${monto(porHa, d.moneda)}/ha equivale a ${num(q)} qq/ha y el tope es ${num(rinde * 0.8)} qq/ha (80% del rinde).`,
        });
      if (q < 3) avisos.push({ tipo: "error", texto: "El mínimo a asegurar es 3 qq/ha o su equivalente." });
    }
  }
  const sumaAsegurada = porHa * ha;
  if (d.plan !== "g" && fila.qq && d.cultivo !== "s") {
    const tope = fila.qq[d.cultivo === "g" ? 0 : 1];
    const q = d.moneda === "qq" ? porHa : precio ? porHa / precio : null;
    if (tope != null && q != null && q > tope)
      avisos.push({ tipo: "alerta", texto: `La tabla de ${d.plan === "h" ? "viento y helada" : "viento"} marca ${tope} qq/ha como máximo para ${cultivo.toLowerCase()} en este departamento.` });
  }

  const prima = (sumaAsegurada * (t + tasaPlanchado)) / 100;
  const premio = recargo == null ? prima : prima * (1 + recargo / 100);
  lineas.push([`Suma asegurada (${d.moneda === "qq" ? `${num(porHa)} qq` : monto(porHa, d.moneda)} × ${num(ha, 0)} ha)`, monto(sumaAsegurada, d.moneda)]);
  lineas.push(["Prima", monto(prima, d.moneda)]);
  if (recargo != null) lineas.push([`Recargo ${f.p} · ${PAGOS.find((p) => p.valor === d.pago)!.corto}`, `+ ${porcentaje(recargo)}`]);
  else avisos.push({ tipo: "error", texto: `No hay recargo publicado para ${f.p}. El premio muestra solo la prima.` });

  // Vigencia
  const hoy = soloDia(ahora);
  // La vigencia siempre arranca después de hoy: 3 días de carencia con póliza previa o reducción paga, 5 si no.
  const carencia = d.polizaPrevia || d.reduccionCarencia ? 3 : 5;
  const inicio = sumarDias(hoy, carencia);
  const [fin, notaFin] = finVigencia(d, f, siembra);
  let inicioViento: Date | null = null;
  if (d.plan !== "g") {
    // Viento y helada tienen la misma carencia (7 días) y las mismas fechas límite de suscripción.
    const adicional = d.plan === "h" ? "viento y helada" : "viento";
    inicioViento = sumarDias(hoy, 7);
    const limite = limiteViento(d, siembra);
    if (limite === "no")
      avisos.push({ tipo: "error", texto: `Con esa fecha de siembra la circular no prevé ${adicional} para ${cultivo.toLowerCase()}.` });
    else if (limite && hoy > limite) avisos.push({ tipo: "error", texto: `Venció el plazo para contratar ${adicional} (${fechaCorta(limite)}).` });
    else if (limite)
      avisos.push({
        tipo: "info",
        texto: `${d.plan === "h" ? "Viento y helada" : "Viento"}: se puede contratar hasta el ${fechaCorta(limite)}. Franquicia 20% fija deducible sobre la suma asegurada del lote.`,
      });
    if (d.plan === "h") avisos.push({ tipo: "info", texto: "Helada: cubre del 01/10 al 31/03, con la misma suma asegurada que granizo." });
  }
  if (d.cultivo === "m" && siembra && siembra > D(2027, 1, 15))
    avisos.push({ tipo: "error", texto: "La circular cubre maíz sembrado hasta el 15/01/2027. Consultá con la Administración." });
  if (descuentoLaSegunda > 10)
    avisos.push({
      tipo: "alerta",
      texto: "La Segunda autoriza hasta 10% de descuento (más el 5% de ciclo productivo, si corresponde). Lo que pase de eso va a cargo de la agencia.",
    });
  if (siembra && siembra > sumarDias(hoy, 60)) avisos.push({ tipo: "alerta", texto: "La fecha de siembra está muy lejos. Revisala." });

  if (d.franquicia === "5o" && !(f.p === "La Pampa" && f.d === "CONHELO" && d.cultivo === "g"))
    avisos.push({ tipo: "info", texto: "La franquicia 5% en esta zona se estima con el ajuste medido en Conhelo (girasol). Compará con el sistema." });
  if (d.franquicia === "d10" || d.franquicia === "d20")
    avisos.push({ tipo: "alerta", texto: "El descuento de la franquicia decreciente se aplica sobre la tasa de 6%. Confirmá la base en el sistema." });
  if (f.p === "Córdoba") avisos.push({ tipo: "alerta", texto: "Córdoba tiene condiciones especiales en algunas zonas: la circular pide consultar caso por caso." });
  if (d.moneda === "qq" && !canje)
    avisos.push({ tipo: "info", texto: "Póliza en quintales: se ajusta por la pizarra de Rosario entre el inicio de vigencia y el día 10 del mes de vencimiento." });

  return {
    tipo: "ok",
    fila: { provincia: f.p, depto: titulo(f.d) },
    lineas,
    tasaFinal: t + tasaPlanchado,
    sumaAsegurada,
    porHa,
    prima,
    recargo,
    premio,
    inicio,
    inicioViento,
    fin,
    notaFin,
    maizTardio,
    avisos,
  };
}

// ---------- Textos ----------

/** "GENERAL SAN MARTÍN" → "General San Martín"; deja como están las siglas y rutas ("R7", "L.N."). */
export function titulo(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/(^|[\s(.-])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toUpperCase())
    .replace(/\b(R)(\d+)/gi, (_, r: string, n: string) => r.toUpperCase() + n)
    .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (p, _x, pos: number) => (pos === 0 ? p : p.toLowerCase()));
}

export const textoCultivo = (c: Cultivo) => CULTIVOS.find((x) => x.valor === c)!.texto;
export const textoPlan = (p: Plan) => PLANES.find((x) => x.valor === p)!.texto;
export const textoPago = (p: Pago) => PAGOS.find((x) => x.valor === p)!.texto;
export const textoResiembra = (r: Resiembra) => RESIEMBRAS.find((x) => x.valor === r)!.texto;
export const textoFranquiciaGranizo = (d: Pick<DatosGranizo, "depto" | "plan" | "franquicia">) =>
  (opcionesFranquicia(d.depto, d.plan).find((x) => x.valor === d.franquicia)?.texto ?? "").replace(/ \(.*\)$/, "");

export function nombreArchivoGranizo(c: CotizacionGranizo): string {
  return `Granizo-La-Segunda-${paraArchivo(c.cliente) || "cliente"}-${c.numero}.pdf`;
}

/** Lo que falta para entregar el PDF, en palabras del productor. */
export function faltantesGranizo(d: DatosGranizo, estado: EstadoGranizo): string[] {
  const falta: string[] = [];
  if (!d.cliente.trim()) falta.push("el nombre del cliente");
  if (estado.tipo === "faltan-datos") falta.push(...estado.falta);
  if (estado.tipo === "sin-tasa") falta.push("una combinación con tasa publicada");
  return falta;
}
