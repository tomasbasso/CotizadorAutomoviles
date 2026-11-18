import ap from "../../datos/planes-ap.json";
import comercio from "../../datos/planes-comercio.json";
import hogar from "../../datos/planes-hogar.json";
import vida from "../../datos/planes-vida.json";
import { paraArchivo, precioParaMostrar } from "./cotizacion";

/**
 * Cotizadores de plan + precio a mano para los ramos que no son auto: hogar, vida, accidentes personales y comercio.
 * Todo sale de datos/planes-<ramo>.json (coberturas y planes relevados de la web pública de La Segunda);
 * el precio lo pone el productor, como en auto.
 */

export type RamoId = "hogar" | "vida" | "ap" | "comercio";
export type Moneda = "ars" | "usd";
export type PeriodoRamo = "mes" | "cuatrimestre" | "semestre" | "año" | "vigencia";

export type CoberturaRamo = { nombre: string; detalle: string; porPlan?: Record<string, string> };

export type FilaRamo = {
  id: string;
  nombre: string;
  /** Entrada del glosario que explica la fila. */
  cobertura: string;
  /** El productor puede cargar una suma asegurada. */
  suma?: boolean;
  /** Sin suma no se puede entregar el PDF. */
  requerida?: boolean;
  /** Va en la tarjeta de precio, debajo del plan. */
  destacada?: boolean;
  /** Se tilda por opción: true en todos los planes o la lista de planes donde es adicional. */
  opcional?: boolean | string[];
  /** Viene tildada al sumar una opción. */
  predeterminada?: boolean;
  /** Valor que no se carga (por ejemplo, el sepelio de accidentes personales). */
  fijo?: string;
  /** Lo que se agrega después del monto ("por día"). */
  unidad?: string;
  /** Mínimo y máximo de la suma por plan, según la web. */
  limites?: Record<string, [number, number]>;
};

export type GrupoRamo = { nombre: string; filas: FilaRamo[] };

export type PlanRamo = {
  codigo: string;
  nombre: string;
  tipo: string;
  coberturas: string[];
  sobre?: { titular: string; intro: string; vinetas: { titulo: string; texto: string }[] };
};

export type CampoRamo = {
  id: string;
  etiqueta: string;
  placeholder: string;
  /** Cómo se nombra en "Falta ..." si es obligatorio. */
  requerido?: string;
  tipo?: "edad";
  min?: number;
  max?: number;
  avisoMin?: string;
  avisoMax?: string;
  sugerencias?: string[];
};

export type Ramo = {
  ramo: RamoId;
  nombre: string;
  fuente: string;
  relevado: string;
  cotizacion: {
    titulo: string;
    bajada: string;
    asunto: string;
    saludo: string;
    /** Bajada del glosario en el PDF, cuando no todos los textos son de La Segunda. */
    introGlosario?: string;
    campos: CampoRamo[];
    monedas: Moneda[];
    periodos: PeriodoRamo[];
    plazo?: { etiqueta: string; sugerencias: string[]; fijo: Record<string, string> };
  };
  coberturas: Record<string, CoberturaRamo>;
  grupos: GrupoRamo[];
  planes: PlanRamo[];
  servicios?: { nombre: string; detalle: string }[];
};

// Los JSON infieren los límites como number[] y no como par; la forma la garantiza el script que los arma.
export const RAMOS: Record<RamoId, Ramo> = {
  hogar: hogar as unknown as Ramo,
  vida: vida as unknown as Ramo,
  ap: ap as unknown as Ramo,
  comercio: comercio as unknown as Ramo,
};

export type OpcionRamo = {
  id: string;
  plan: string;
  /** Normalizado como el precio de auto: dígitos y una coma decimal. */
  precio: string;
  plazo: string;
  /** Suma asegurada por fila, normalizada igual que el precio. */
  sumas: Record<string, string>;
  /** Filas opcionales que lleva esta opción. */
  incluidas: string[];
  recomendada: boolean;
};

export type CotizacionRamo = {
  ramo: RamoId;
  numero: string;
  fecha: Date;
  cliente: string;
  campos: Record<string, string>;
  moneda: Moneda;
  periodo: PeriodoRamo;
  opciones: OpcionRamo[];
};

export type DatosRamo = Omit<CotizacionRamo, "numero" | "fecha">;

export const MAX_OPCIONES_RAMO = 3;

const TEXTO_PERIODO: Record<PeriodoRamo, string> = {
  mes: "por mes",
  cuatrimestre: "por cuatrimestre",
  semestre: "por semestre",
  año: "por año",
  vigencia: "por toda la vigencia",
};
export const textoPeriodoRamo = (p: PeriodoRamo) => TEXTO_PERIODO[p];
export const MONEDAS_RAMO: { valor: Moneda; texto: string }[] = [
  { valor: "ars", texto: "Pesos" },
  { valor: "usd", texto: "Dólares" },
];
export const simbolo = (m: Moneda) => (m === "usd" ? "US$" : "$");

export function datosIniciales(ramo: RamoId): DatosRamo {
  const r = RAMOS[ramo];
  return {
    ramo,
    cliente: "",
    campos: Object.fromEntries(r.cotizacion.campos.map((c) => [c.id, ""])),
    moneda: r.cotizacion.monedas[0],
    periodo: r.cotizacion.periodos[0],
    opciones: [],
  };
}

export const filasDe = (r: Ramo) => r.grupos.flatMap((g) => g.filas);

export function planDe(r: Ramo, codigo: string): PlanRamo {
  const p = r.planes.find((x) => x.codigo === codigo);
  if (!p) throw new Error(`Plan desconocido en ${r.ramo}: ${codigo}`);
  return p;
}

export const enPlan = (f: FilaRamo, p: PlanRamo) => p.coberturas.includes(f.cobertura);
export const esOpcional = (f: FilaRamo, p: PlanRamo) => f.opcional === true || (Array.isArray(f.opcional) && f.opcional.includes(p.codigo));
/** La opción lleva esta fila: está en el plan y, si es opcional, está tildada. */
export const lleva = (f: FilaRamo, p: PlanRamo, o: Pick<OpcionRamo, "incluidas">) => enPlan(f, p) && (!esOpcional(f, p) || o.incluidas.includes(f.id));

export function opcionNueva(r: Ramo, plan: PlanRamo): OpcionRamo {
  return {
    id: crypto.randomUUID(),
    plan: plan.codigo,
    precio: "",
    plazo: "",
    sumas: {},
    incluidas: filasDe(r).filter((f) => f.predeterminada && enPlan(f, plan) && esOpcional(f, plan)).map((f) => f.id),
    recomendada: false,
  };
}

export const numeroDe = (valor: string | undefined) => Number((valor ?? "").replace(",", ".")) || 0;

/** "50000000" → "$ 50.000.000"; en dólares, "US$ 50.000". */
export function montoRamo(valor: string | number, moneda: Moneda): string {
  const texto = precioParaMostrar(typeof valor === "number" ? String(valor).replace(".", ",") : valor);
  return moneda === "usd" ? texto.replace("$", "US$") : texto;
}

export type CeldaRamo = { tipo: "no" } | { tipo: "no-incluye" } | { tipo: "si" } | { tipo: "nota"; texto: string };

export function celdaRamo(f: FilaRamo, p: PlanRamo, o: OpcionRamo, moneda: Moneda): CeldaRamo {
  if (!enPlan(f, p)) return { tipo: "no" };
  if (!lleva(f, p, o)) return { tipo: "no-incluye" };
  if (f.fijo) return { tipo: "nota", texto: f.fijo };
  const suma = numeroDe(o.sumas[f.id]);
  if (f.suma && suma > 0) return { tipo: "nota", texto: montoRamo(o.sumas[f.id], moneda) };
  return { tipo: "si" };
}

export function plazoDe(r: Ramo, o: Pick<OpcionRamo, "plan" | "plazo">): string {
  const config = r.cotizacion.plazo;
  if (!config) return "";
  return config.fijo[o.plan] ?? o.plazo.trim();
}

/** Lo que dice el campo de edad, o null si está vacío. */
export function avisoCampo(c: CampoRamo, valor: string): string | null {
  if (c.tipo !== "edad" || !valor) return null;
  const edad = Number(valor);
  if (c.min != null && edad < c.min) return c.avisoMin ?? `La edad mínima es ${c.min} años.`;
  if (c.max != null && edad > c.max) return c.avisoMax ?? `La edad máxima es ${c.max} años.`;
  return null;
}

/** Suma fuera del mínimo o máximo que publica la web para el plan. */
export function avisoSuma(f: FilaRamo, p: PlanRamo, valor: string, moneda: Moneda): string | null {
  const limites = f.limites?.[p.codigo];
  const n = numeroDe(valor);
  if (!limites || !n) return null;
  const [min, max] = limites;
  if (n < min) return `El mínimo para el ${p.nombre} es ${montoRamo(min, moneda)}.`;
  if (n > max) return `El máximo para el ${p.nombre} es ${montoRamo(max, moneda)}.`;
  return null;
}

/** Lo que falta para entregar el PDF, en palabras del productor. */
export function faltantesRamo(d: DatosRamo): string[] {
  const r = RAMOS[d.ramo];
  const falta: string[] = [];
  if (!d.cliente.trim()) falta.push("el nombre del cliente");
  for (const c of r.cotizacion.campos) if (c.requerido && !d.campos[c.id]?.trim()) falta.push(c.requerido);
  if (d.opciones.length === 0) falta.push(r.planes.length > 1 ? "al menos un plan" : "al menos una opción");
  d.opciones.forEach((o, i) => {
    const plan = planDe(r, o.plan);
    if (!(numeroDe(o.precio) > 0)) falta.push(`el precio de la opción ${i + 1}`);
    for (const f of filasDe(r))
      if (f.requerida && lleva(f, plan, o) && !(numeroDe(o.sumas[f.id]) > 0))
        falta.push(`la suma de ${f.nombre.toLowerCase()} de la opción ${i + 1}`);
    if (r.cotizacion.plazo && !plazoDe(r, o)) falta.push(`el plazo de la opción ${i + 1}`);
  });
  return falta;
}

/** "Seguro de vida · 42 años"; "Seguro de hogar · San Martín 450, Winifreda". */
export function subtituloRamo(d: Pick<DatosRamo, "ramo" | "campos">): string {
  const r = RAMOS[d.ramo];
  const partes = r.cotizacion.campos
    .map((c) => {
      const v = d.campos[c.id]?.trim();
      if (!v) return "";
      if (c.tipo === "edad") return `${v} años`;
      if (c.id === "vigencia") return `Vigencia ${v}`;
      return v;
    })
    .filter(Boolean);
  return [r.cotizacion.asunto, ...partes].join(" · ");
}

export function nombreArchivoRamo(c: CotizacionRamo): string {
  return `${paraArchivo(RAMOS[c.ramo].nombre)}-La-Segunda-${paraArchivo(c.cliente) || "cliente"}-${c.numero}.pdf`;
}

/** Coberturas del glosario que aparecen en la cotización, con el texto de cada plan si cambia. */
export function glosarioRamo(r: Ramo, opciones: OpcionRamo[]) {
  const ids: string[] = [];
  for (const f of filasDe(r)) {
    if (ids.includes(f.cobertura)) continue;
    if (opciones.some((o) => lleva(f, planDe(r, o.plan), o))) ids.push(f.cobertura);
  }
  const planes = [...new Set(opciones.map((o) => o.plan))].map((c) => planDe(r, c));
  return ids.map((id) => {
    const c = r.coberturas[id];
    const textos = new Map<string, string[]>();
    for (const p of planes) {
      if (!p.coberturas.includes(id)) continue;
      const t = c.porPlan?.[p.codigo] ?? c.detalle;
      textos.set(t, [...(textos.get(t) ?? []), p.nombre]);
    }
    const variantes = [...textos.entries()].map(([texto, nombres]) => ({ texto, planes: textos.size > 1 ? nombres : [] }));
    return { id, nombre: c.nombre, variantes };
  });
}
