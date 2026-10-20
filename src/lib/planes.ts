import datos from "../../datos/planes-auto.json";

export type CoberturaId = keyof typeof datos.coberturas;

export type Plan = {
  codigo: string;
  nombre: string;
  tipo: string;
  coberturas: CoberturaId[];
};

export type Cobertura = {
  nombre: string;
  detalle: string;
  limites?: Record<string, string>;
  ejemplo?: string;
};

export const PLANES = datos.planes as Plan[];
export const COBERTURAS = datos.coberturas as Record<CoberturaId, Cobertura>;
export const RELEVADO = datos.relevado;

/** Valor de una celda de la tabla comparativa. */
export type Celda =
  | { tipo: "no" }
  | { tipo: "si" }
  | { tipo: "nota"; texto: string };

export type Fila = {
  id: string;
  nombre: string;
  /** Coberturas del JSON que alimentan esta fila (granizo con y sin límite comparten fila). */
  fuentes: CoberturaId[];
  celda?: (plan: Plan) => Celda | null;
  /** Se muestra siempre y, donde falta, dice "No cubre": el cliente tiene que ver lo que no le cubre su plan. */
  aclararFalta?: boolean;
};

export type Grupo = { nombre: string; filas: Fila[] };

const tiene = (plan: Plan, id: CoberturaId) => plan.coberturas.includes(id);

const CRISTALES_SIN_LIMITE = ["30", "L200"];

/** Orden en que se muestran las coberturas, agrupadas para que el cliente las lea de un vistazo. */
export const GRUPOS: Grupo[] = [
  {
    nombre: "Responsabilidad civil",
    filas: [{ id: "rc", nombre: "Responsabilidad Civil", fuentes: ["rc"] }],
  },
  {
    nombre: "Daños al vehículo",
    filas: [
      { id: "incendio_total", nombre: "Incendio total", fuentes: ["incendio_total"] },
      { id: "incendio_parcial", nombre: "Incendio parcial", fuentes: ["incendio_parcial"] },
      { id: "accidente_total", nombre: "Accidente total", fuentes: ["accidente_total"], aclararFalta: true },
      {
        id: "accidente_parcial",
        nombre: "Accidente parcial",
        fuentes: ["accidente_parcial"],
        aclararFalta: true,
        celda: (p) => (tiene(p, "accidente_parcial") ? { tipo: "nota", texto: "Con franquicia" } : null),
      },
      {
        id: "granizo",
        nombre: "Daños por granizo",
        fuentes: ["granizo", "granizo_limite"],
        celda: (p) => {
          if (tiene(p, "granizo")) return { tipo: "si" };
          if (tiene(p, "granizo_limite")) return { tipo: "nota", texto: "Hasta 10%" };
          return null;
        },
      },
    ],
  },
  {
    nombre: "Robo",
    filas: [
      { id: "robo_total", nombre: "Robo o hurto total", fuentes: ["robo_total"] },
      { id: "robo_parcial", nombre: "Robo o hurto parcial", fuentes: ["robo_parcial"] },
      {
        id: "danos_amparo_robo",
        nombre: "Daños parciales por robo total",
        fuentes: ["danos_amparo_robo"],
        celda: (p) => (tiene(p, "danos_amparo_robo") ? { tipo: "nota", texto: "Hasta 3%" } : null),
      },
      { id: "cubiertas", nombre: "Reposición de cubiertas", fuentes: ["cubiertas"] },
      {
        id: "tambor",
        nombre: "Tambor de arranque",
        fuentes: ["tambor"],
        celda: (p) => (tiene(p, "tambor") ? { tipo: "nota", texto: "Hasta 1%" } : null),
      },
    ],
  },
  {
    nombre: "Cristales y extras",
    filas: [
      {
        id: "cristales",
        nombre: "Cristales laterales y cerraduras",
        fuentes: ["cristales"],
        celda: (p) => {
          if (!tiene(p, "cristales")) return null;
          return CRISTALES_SIN_LIMITE.includes(p.codigo)
            ? { tipo: "nota", texto: "Sin límite" }
            : { tipo: "nota", texto: "Hasta 1%" };
        },
      },
      { id: "parabrisas", nombre: "Parabrisas y luneta", fuentes: ["parabrisas"] },
      { id: "techo", nombre: "Techo corredizo", fuentes: ["techo"] },
      { id: "airbag", nombre: "Reposición de airbag", fuentes: ["airbag"] },
      { id: "reposicion_nuevo", nombre: "Reposición a nuevo (0 km)", fuentes: ["reposicion_nuevo"] },
    ],
  },
  {
    nombre: "Servicios y beneficios",
    filas: [
      { id: "conductor", nombre: "Seguro del conductor", fuentes: ["conductor"] },
      { id: "asistencia", nombre: "Asistencia al vehículo y personas", fuentes: ["asistencia"] },
      { id: "cleas", nombre: "CLEAS", fuentes: ["cleas"] },
      { id: "bonificacion", nombre: "Bonificación por no siniestralidad", fuentes: ["bonificacion"] },
    ],
  },
];

export const FILAS = GRUPOS.flatMap((g) => g.filas);

export function celdaDe(fila: Fila, plan: Plan): Celda {
  if (fila.celda) return fila.celda(plan) ?? { tipo: "no" };
  return fila.fuentes.some((f) => tiene(plan, f)) ? { tipo: "si" } : { tipo: "no" };
}

export function planPorCodigo(codigo: string): Plan {
  const plan = PLANES.find((p) => p.codigo === codigo);
  if (!plan) throw new Error(`Plan desconocido: ${codigo}`);
  return plan;
}

/** Cantidad de filas de la tabla que el plan cubre (granizo con límite cuenta). */
export function cantidadCoberturas(plan: Plan): number {
  return FILAS.filter((f) => celdaDe(f, plan).tipo !== "no").length;
}

/**
 * Aclaración para los planes que no son Todo Riesgo: es la pregunta que más reclamos genera
 * ("choqué un perro y no me cubre el paragolpes").
 */
export function advertenciaChoque(plan: Plan): string | null {
  if (tiene(plan, "accidente_parcial")) return null;
  if (tiene(plan, "accidente_total")) return "No cubre daños parciales por choque, como chocar un perro.";
  return "No cubre daños a tu auto por choque, como chocar un perro.";
}

export const PLAN_CON_FRANQUICIA = "30";
export const FRANQUICIAS_SUGERIDAS = ["1,5%", "2,5%", "3,5%", "5%"];
