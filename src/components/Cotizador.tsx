"use client";

import { CircleAlert, Plus, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Cotizacion,
  MAX_OPCIONES,
  type Opcion,
  PERIODOS,
  type Periodo,
  faltantes,
  nombreArchivo,
  normalizarPrecio,
  numeroCotizacion,
  precioParaInput,
  textoPeriodo,
} from "@/lib/cotizacion";
import {
  FILAS,
  FRANQUICIAS_SUGERIDAS,
  PLAN_CON_FRANQUICIA,
  PLANES,
  type Plan,
  advertenciaChoque,
  cantidadCoberturas,
  celdaDe,
  planPorCodigo,
} from "@/lib/planes";
import {
  BarraAcciones,
  BotonReiniciar,
  Campo,
  PanelVistaPrevia,
  Pantalla,
  Secciones,
  VistaVacia,
  textoFaltantes,
  estiloInput,
  useAccionesPDF,
  useMedia,
  usePuedeCompartir,
  useVistaPrevia,
} from "./comun";

type Datos = Omit<Cotizacion, "numero" | "fecha">;

const DATOS_INICIALES: Datos = { cliente: "", vehiculo: "", anio: "", periodo: "mes", opciones: [] };

async function armarArchivo(datos: Datos): Promise<File> {
  const fecha = new Date();
  const cotizacion: Cotizacion = { ...datos, fecha, numero: numeroCotizacion(fecha) };
  const { generarPDF } = await import("@/pdf/generar");
  const blob = await generarPDF(cotizacion);
  return new File([blob], nombreArchivo(cotizacion), { type: "application/pdf" });
}

export function Cotizador() {
  const [datos, setDatos] = useState<Datos>(DATOS_INICIALES);
  const [enfocar, setEnfocar] = useState<string | null>(null);
  const escritorio = useMedia("(min-width: 1024px)");
  const puedeCompartir = usePuedeCompartir();
  const armar = useMemo(() => (datos.opciones.length > 0 ? () => armarArchivo(datos) : null), [datos]);
  const vista = useVistaPrevia(armar, escritorio);

  // Solo en desarrollo: /?demo precarga una cotización de ejemplo para revisar el PDF.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !window.location.search.includes("demo")) return;
    const sinTodoRiesgo = window.location.search.includes("demo=2");
    const ahora = setTimeout(() =>
      setDatos({
        cliente: "María Gómez",
        vehiculo: "Toyota Hilux 2.8 SRX 4x4",
        anio: "2022",
        periodo: "mes",
        opciones: sinTodoRiesgo
          ? [
              { id: "demo-1", plan: "L200", precio: "68900", franquicia: "", franquiciaMonto: "", recomendada: true },
              { id: "demo-2", plan: "36", precio: "41200", franquicia: "", franquiciaMonto: "", recomendada: false },
              { id: "demo-3", plan: "20", precio: "23500", franquicia: "", franquiciaMonto: "", recomendada: false },
            ]
          : [
              { id: "demo-1", plan: "30", precio: "85400", franquicia: "2,5%", franquiciaMonto: "450000", recomendada: false },
              { id: "demo-2", plan: "L200", precio: "68900", franquicia: "", franquiciaMonto: "", recomendada: true },
              { id: "demo-3", plan: "29", precio: "52300", franquicia: "", franquiciaMonto: "", recomendada: false },
            ],
      }),
    );
    return () => clearTimeout(ahora);
  }, []);

  const falta = faltantes(datos);
  const lista = falta.length === 0;
  const hayDatos = Boolean(datos.cliente || datos.vehiculo || datos.anio || datos.opciones.length);

  const acciones = useAccionesPDF(
    () => armarArchivo(datos),
    () => {
      const nombre = datos.cliente.trim().split(/\s+/)[0];
      return `Hola ${nombre}, te paso la cotización del seguro para tu ${datos.vehiculo.trim()}.`;
    },
    lista,
  );

  const actualizar = (cambio: Partial<Datos>) => {
    acciones.limpiarError();
    setDatos((d) => ({ ...d, ...cambio }));
  };

  const agregar = (plan: Plan) => {
    if (datos.opciones.length >= MAX_OPCIONES) return;
    const id = crypto.randomUUID();
    actualizar({
      opciones: [...datos.opciones, { id, plan: plan.codigo, precio: "", franquicia: "", franquiciaMonto: "", recomendada: false }],
    });
    setEnfocar(id);
  };

  const cambiarOpcion = (id: string, cambio: Partial<Opcion>) => {
    actualizar({
      opciones: datos.opciones.map((o) => {
        if (o.id === id) return { ...o, ...cambio };
        return cambio.recomendada ? { ...o, recomendada: false } : o;
      }),
    });
  };

  const quitar = (id: string) => actualizar({ opciones: datos.opciones.filter((o) => o.id !== id) });

  const reiniciar = () => {
    if (hayDatos && !window.confirm("¿Borrar esta cotización y empezar una nueva?")) return;
    setDatos(DATOS_INICIALES);
    acciones.limpiarError();
  };

  const estado = lista
    ? `Lista para enviar · ${datos.opciones.length} ${datos.opciones.length === 1 ? "opción" : "opciones"}`
    : textoFaltantes(falta);

  return (
    <Pantalla
      barra={
        <BarraAcciones
          estado={estado}
          error={acciones.error}
          lista={lista}
          accion={acciones.accion}
          puedeCompartir={puedeCompartir}
          ejecutar={acciones.ejecutar}
        />
      }
      vistaPrevia={
        <PanelVistaPrevia
          vista={vista}
          titulo="Vista previa de la cotización"
          vacio={
            datos.opciones.length === 0 ? (
              <VistaVacia
                titulo="Todavía no elegiste planes"
                texto="Tocá un plan de la lista y la cotización aparece acá, tal cual le va a llegar al cliente."
              />
            ) : null
          }
        />
      }
    >
      <div className="space-y-6">
        <Secciones actual="auto" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-balance">Nueva cotización</h1>
            <p className="mt-1.5 max-w-[48ch] text-[15px] leading-relaxed text-suave">
              Cargá el cliente y el vehículo, elegí hasta {MAX_OPCIONES} planes y poné el precio de cada uno.
            </p>
          </div>
          {hayDatos && <BotonReiniciar onClick={reiniciar} />}
        </div>
      </div>

      <section aria-labelledby="titulo-cliente" className="space-y-4">
        <h2 id="titulo-cliente" className="text-base font-semibold">
          Cliente y vehículo
        </h2>
        <Campo etiqueta="Nombre y apellido">
          <input
            className={estiloInput}
            value={datos.cliente}
            onChange={(e) => actualizar({ cliente: e.target.value })}
            placeholder="Ej.: María Gómez"
            autoComplete="off"
            enterKeyHint="next"
          />
        </Campo>
        <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Campo etiqueta="Vehículo">
            <input
              className={estiloInput}
              value={datos.vehiculo}
              onChange={(e) => actualizar({ vehiculo: e.target.value })}
              placeholder="Ej.: Toyota Hilux 2.8 SRX 4x4"
              autoComplete="off"
              enterKeyHint="next"
            />
          </Campo>
          <Campo etiqueta="Año">
            <input
              className={`${estiloInput} tabular-nums`}
              value={datos.anio}
              onChange={(e) => actualizar({ anio: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="2022"
              inputMode="numeric"
              autoComplete="off"
            />
          </Campo>
        </div>
      </section>

      <section aria-labelledby="titulo-planes" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 id="titulo-planes" className="text-base font-semibold">
              Planes de La Segunda
            </h2>
            <p className="mt-1 text-[13px] text-suave">De más a menos cobertura. Tocá un plan para sumarlo.</p>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-suave">
            Precios
            <select
              value={datos.periodo}
              onChange={(e) => actualizar({ periodo: e.target.value as Periodo })}
              className="h-9 rounded-full border border-linea bg-white pr-8 pl-3 text-[13px] font-medium text-tinta hover:border-[#dccdd2] focus:border-rojo focus:ring-[3px] focus:ring-rojo/15 focus-visible:outline-none"
            >
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.texto}
                </option>
              ))}
            </select>
          </label>
        </div>

        {datos.opciones.length >= MAX_OPCIONES && (
          <p className="rounded-lg bg-rosa px-3.5 py-2.5 text-[13px] text-rojo-oscuro">
            Ya tenés {MAX_OPCIONES} opciones. Quitá una para sumar otro plan.
          </p>
        )}

        <ol className="divide-y divide-linea overflow-hidden rounded-xl border border-linea">
          {PLANES.map((plan) => (
            <FilaPlan
              key={plan.codigo}
              plan={plan}
              opciones={datos.opciones}
              periodo={datos.periodo}
              enfocar={enfocar}
              alEnfocar={() => setEnfocar(null)}
              onAgregar={() => agregar(plan)}
              onCambiar={cambiarOpcion}
              onQuitar={quitar}
            />
          ))}
        </ol>
      </section>
    </Pantalla>
  );
}

function Pips({ plan }: { plan: Plan }) {
  const total = FILAS.length;
  const cubre = cantidadCoberturas(plan);
  return (
    <span
      role="img"
      aria-label={`Cubre ${cubre} de ${total} coberturas`}
      className="hidden shrink-0 items-center gap-[3px] sm:flex"
    >
      {FILAS.map((f) => (
        <span
          key={f.id}
          className={`h-3.5 w-[5px] rounded-[1.5px] ${celdaDe(f, plan).tipo === "no" ? "bg-linea" : "bg-rojo"}`}
        />
      ))}
    </span>
  );
}

type FilaPlanProps = {
  plan: Plan;
  opciones: Opcion[];
  periodo: Periodo;
  enfocar: string | null;
  alEnfocar: () => void;
  onAgregar: () => void;
  onCambiar: (id: string, cambio: Partial<Opcion>) => void;
  onQuitar: (id: string) => void;
};

function FilaPlan({ plan, opciones, periodo, enfocar, alEnfocar, onAgregar, onCambiar, onQuitar }: FilaPlanProps) {
  const propias = opciones.map((o, i) => ({ ...o, numero: i + 1 })).filter((o) => o.plan === plan.codigo);
  const elegido = propias.length > 0;
  const hayLugar = opciones.length < MAX_OPCIONES;
  const cubre = cantidadCoberturas(plan);

  const contenido = (
    <>
      <span className="w-11 shrink-0 text-[15px] font-bold tracking-tight text-rojo tabular-nums">{plan.codigo}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug font-semibold text-pretty">{plan.nombre}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-suave">
          {plan.tipo}
          <span className="sm:hidden"> · {cubre} coberturas</span>
        </span>
      </span>
      <Pips plan={plan} />
      {elegido ? (
        <span className="shrink-0 text-[13px] font-semibold text-rojo">
          {propias.map((o) => `Opción ${o.numero}`).join(" · ")}
        </span>
      ) : (
        <span
          aria-hidden
          className={`grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
            hayLugar
              ? "border-linea text-suave group-hover:border-rojo group-hover:bg-rojo group-hover:text-white"
              : "border-transparent text-transparent"
          }`}
        >
          <Plus size={16} />
        </span>
      )}
    </>
  );

  return (
    <li className={elegido ? "bg-rosa" : "bg-white"}>
      {elegido ? (
        <div className="flex items-center gap-4 px-4 py-3.5">{contenido}</div>
      ) : (
        <button
          type="button"
          onClick={onAgregar}
          disabled={!hayLugar}
          aria-label={`Sumar ${plan.nombre} (${plan.tipo}, ${cubre} coberturas)`}
          className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors duration-200 focus-visible:-outline-offset-2 enabled:hover:bg-rosa/60 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {contenido}
        </button>
      )}

      {elegido && (
        <div className="space-y-3 px-4 pb-4">
          {propias.map((o) => (
            <EditorOpcion
              key={o.id}
              opcion={o}
              numero={o.numero}
              periodo={periodo}
              enfocar={enfocar === o.id}
              alEnfocar={alEnfocar}
              onCambiar={(cambio) => onCambiar(o.id, cambio)}
              onQuitar={() => onQuitar(o.id)}
            />
          ))}
          {hayLugar && (
            <button
              type="button"
              onClick={onAgregar}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-rojo-oscuro transition-colors hover:bg-white"
            >
              <Plus size={14} aria-hidden />
              Otra opción con este plan
            </button>
          )}
        </div>
      )}
    </li>
  );
}

type EditorOpcionProps = {
  opcion: Opcion;
  numero: number;
  periodo: Periodo;
  enfocar: boolean;
  alEnfocar: () => void;
  onCambiar: (cambio: Partial<Opcion>) => void;
  onQuitar: () => void;
};

function EditorOpcion({ opcion, numero, periodo, enfocar, alEnfocar, onCambiar, onQuitar }: EditorOpcionProps) {
  const precioRef = useRef<HTMLInputElement>(null);
  const conFranquicia = opcion.plan === PLAN_CON_FRANQUICIA;
  const advertencia = advertenciaChoque(planPorCodigo(opcion.plan));

  useEffect(() => {
    if (!enfocar) return;
    precioRef.current?.focus();
    alEnfocar();
  }, [enfocar, alEnfocar]);

  return (
    <div className="animate-despliegue rounded-xl border border-linea bg-white p-4 shadow-[0_1px_2px_rgba(35,26,29,0.04),0_8px_20px_-12px_rgba(35,26,29,0.18)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-rojo">Opción {numero}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={opcion.recomendada}
            onClick={() => onCambiar({ recomendada: !opcion.recomendada })}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-suave transition-colors duration-200 hover:bg-fondo hover:text-tinta aria-pressed:bg-rojo aria-pressed:text-white aria-pressed:hover:bg-rojo-oscuro aria-pressed:hover:text-white"
          >
            <Star size={14} aria-hidden fill={opcion.recomendada ? "currentColor" : "none"} />
            Recomendada
          </button>
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar opción ${numero}`}
            className="grid size-8 place-items-center rounded-full text-suave transition-colors hover:bg-fondo hover:text-tinta"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-2 flex h-14 items-center rounded-lg border border-linea bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-rojo focus-within:ring-[3px] focus-within:ring-rojo/15 hover:border-[#dccdd2]">
        <span className="pl-4 text-xl font-semibold text-suave" aria-hidden>
          $
        </span>
        <input
          ref={precioRef}
          aria-label={`Precio de la opción ${numero}`}
          value={precioParaInput(opcion.precio)}
          onChange={(e) => onCambiar({ precio: normalizarPrecio(e.target.value) })}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          className="h-full w-0 min-w-0 flex-1 bg-transparent px-2 text-2xl font-bold tracking-[-0.02em] tabular-nums placeholder:text-[#7d7175] focus-visible:outline-none"
        />
        <span className="pr-4 text-[13px] whitespace-nowrap text-suave">{textoPeriodo(periodo)}</span>
      </div>

      {advertencia && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-snug text-rojo-oscuro">
          <CircleAlert size={14} className="mt-[2px] shrink-0" aria-hidden />
          <span>El PDF le aclara al cliente: {advertencia.charAt(0).toLowerCase() + advertencia.slice(1)}</span>
        </p>
      )}

      {conFranquicia && (
        <fieldset className="mt-4">
          <legend className="text-[13px] font-medium text-suave">Franquicia (accidente parcial)</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {FRANQUICIAS_SUGERIDAS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={opcion.franquicia === f}
                onClick={() => onCambiar({ franquicia: opcion.franquicia === f ? "" : f })}
                className="h-9 rounded-full border border-linea px-3.5 text-sm font-medium tabular-nums transition-colors duration-200 hover:border-rojo/50 aria-pressed:border-rojo aria-pressed:bg-rojo aria-pressed:text-white"
              >
                {f}
              </button>
            ))}
            <div className="flex h-9 w-44 items-center rounded-full border border-linea bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-rojo focus-within:ring-[3px] focus-within:ring-rojo/15 hover:border-[#dccdd2]">
              <span className="pl-3.5 text-sm font-semibold text-suave" aria-hidden>
                $
              </span>
              <input
                value={precioParaInput(opcion.franquiciaMonto)}
                onChange={(e) => onCambiar({ franquiciaMonto: normalizarPrecio(e.target.value) })}
                inputMode="decimal"
                placeholder="Monto"
                aria-label={`Monto de la franquicia de la opción ${numero}, en pesos`}
                autoComplete="off"
                className="h-full w-0 min-w-0 flex-1 bg-transparent pr-3.5 pl-1.5 text-sm font-semibold tabular-nums placeholder:font-normal placeholder:text-[#7d7175] focus-visible:outline-none"
              />
            </div>
          </div>
        </fieldset>
      )}
    </div>
  );
}
