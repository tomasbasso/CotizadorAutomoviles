"use client";

import { Plus, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizarPrecio, numeroCotizacion, precioParaInput } from "@/lib/cotizacion";
import {
  type CampoRamo,
  type CotizacionRamo,
  type DatosRamo,
  type FilaRamo,
  MAX_OPCIONES_RAMO,
  MONEDAS_RAMO,
  type OpcionRamo,
  type PeriodoRamo,
  type PlanRamo,
  RAMOS,
  type Ramo,
  type RamoId,
  avisoCampo,
  avisoSuma,
  datosIniciales,
  enPlan,
  esOpcional,
  faltantesRamo,
  filasDe,
  lleva,
  nombreArchivoRamo,
  opcionNueva,
  planDe,
  simbolo,
  textoPeriodoRamo,
} from "@/lib/ramos";
import {
  BarraAcciones,
  BotonReiniciar,
  Campo,
  MensajeError,
  PanelVistaPrevia,
  Pantalla,
  Secciones,
  Segmentos,
  VistaVacia,
  estiloInput,
  textoFaltantes,
  useAccionesPDF,
  useMedia,
  usePuedeCompartir,
  useVistaPrevia,
} from "./comun";

async function armarArchivo(datos: DatosRamo): Promise<File> {
  const fecha = new Date();
  const cotizacion: CotizacionRamo = { ...datos, fecha, numero: numeroCotizacion(fecha) };
  const { generarPDFRamo } = await import("@/pdf/generar");
  const blob = await generarPDFRamo(cotizacion);
  return new File([blob], nombreArchivoRamo(cotizacion), { type: "application/pdf" });
}

/** Solo en desarrollo: /<ramo>?demo precarga una cotización de ejemplo para revisar el PDF. */
function demo(ramo: RamoId): Partial<DatosRamo> {
  const r = RAMOS[ramo];
  const opcion = (plan: string, precio: string, cambios: Partial<OpcionRamo> = {}): OpcionRamo => ({
    ...opcionNueva(r, planDe(r, plan)),
    id: `demo-${plan}-${precio}`,
    precio,
    ...cambios,
  });
  if (ramo === "hogar")
    return {
      cliente: "María Gómez",
      campos: { ubicacion: "San Martín 450, Winifreda" },
      opciones: [
        opcion("selecto", "38500", {
          recomendada: true,
          sumas: { incendio_edificio: "120000000", incendio_contenido: "30000000", robo_contenido: "8000000", rc_hechos_privados: "20000000", cristales: "600000" },
        }),
        opcion("transitoria", "24300", { sumas: { incendio_edificio: "120000000", incendio_contenido: "30000000", robo_contenido: "8000000" } }),
      ],
    };
  if (ramo === "vida")
    return {
      cliente: "Juan Pérez",
      campos: { edad: "42" },
      moneda: "usd",
      opciones: [
        opcion("temporario", "38", { plazo: "10 años", sumas: { fallecimiento: "50000" }, incluidas: ["invalidez"], recomendada: true }),
        opcion("dotal", "145", { plazo: "Hasta los 65", sumas: { fallecimiento: "50000", sobrevida: "30000" }, incluidas: ["invalidez", "doble_accidental"] }),
        opcion("entera", "92", { sumas: { fallecimiento: "50000" } }),
      ],
    };
  if (ramo === "ap")
    return {
      cliente: "Lucía Fernández",
      campos: { actividad: "Productora agropecuaria", edad: "35", vigencia: "6 meses" },
      opciones: [
        opcion("especial", "18900", { sumas: { muerte: "30000000", incapacidad: "30000000", renta: "5000" } }),
        opcion("premium", "27400", { sumas: { muerte: "50000000", incapacidad: "50000000", asistencia: "20000000", renta: "10000" }, recomendada: true }),
      ],
    };
  return {
    cliente: "Ramos Generales El Molino",
    campos: { actividad: "Almacén de ramos generales", ubicacion: "Av. Mitre 120, Winifreda" },
    opciones: [
      opcion("multicobertura", "52000", {
        sumas: { incendio_edificio: "150000000", incendio_contenido: "60000000", robo_contenido: "15000000", rc_comprensiva: "50000000", cristales: "1500000" },
      }),
      opcion("multicobertura", "64800", {
        incluidas: ["incendio_edificio", "incendio_contenido", "cristales", "robo_contenido", "rc_comprensiva", "robo_valores", "electronicos"],
        sumas: { incendio_edificio: "150000000", incendio_contenido: "60000000", robo_contenido: "15000000", rc_comprensiva: "50000000", cristales: "1500000", robo_valores: "3000000", electronicos: "5000000" },
        recomendada: true,
      }),
    ],
  };
}

export function CotizadorRamo({ ramo }: { ramo: RamoId }) {
  const r = RAMOS[ramo];
  const [datos, setDatos] = useState<DatosRamo>(() => datosIniciales(ramo));
  const [enfocar, setEnfocar] = useState<string | null>(null);
  const escritorio = useMedia("(min-width: 1024px)");
  const puedeCompartir = usePuedeCompartir();
  const armar = useMemo(() => (datos.opciones.length > 0 ? () => armarArchivo(datos) : null), [datos]);
  const vista = useVistaPrevia(armar, escritorio);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !window.location.search.includes("demo")) return;
    const t = setTimeout(() => setDatos((d) => ({ ...d, ...demo(ramo) })));
    return () => clearTimeout(t);
  }, [ramo]);

  const falta = faltantesRamo(datos);
  const lista = falta.length === 0;
  const hayDatos = Boolean(datos.cliente || Object.values(datos.campos).some(Boolean) || datos.opciones.length);

  const acciones = useAccionesPDF(
    () => armarArchivo(datos),
    () => `Hola ${datos.cliente.trim().split(/\s+/)[0]}, ${r.cotizacion.saludo}.`,
    lista,
  );

  const actualizar = (cambio: Partial<DatosRamo>) => {
    acciones.limpiarError();
    setDatos((d) => ({ ...d, ...cambio }));
  };

  const agregar = (plan: PlanRamo) => {
    if (datos.opciones.length >= MAX_OPCIONES_RAMO) return;
    const nueva = opcionNueva(r, plan);
    actualizar({ opciones: [...datos.opciones, nueva] });
    setEnfocar(nueva.id);
  };

  const cambiarOpcion = (id: string, cambio: Partial<OpcionRamo>) =>
    actualizar({
      opciones: datos.opciones.map((o) => {
        if (o.id === id) return { ...o, ...cambio };
        return cambio.recomendada ? { ...o, recomendada: false } : o;
      }),
    });

  const quitar = (id: string) => actualizar({ opciones: datos.opciones.filter((o) => o.id !== id) });

  const reiniciar = () => {
    if (hayDatos && !window.confirm("¿Borrar esta cotización y empezar una nueva?")) return;
    setDatos(datosIniciales(ramo));
    acciones.limpiarError();
  };

  const estado = lista
    ? `Lista para enviar · ${datos.opciones.length} ${datos.opciones.length === 1 ? "opción" : "opciones"}`
    : textoFaltantes(falta);
  const unPlan = r.planes.length === 1;

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
          titulo={`Vista previa de la cotización de ${r.nombre.toLowerCase()}`}
          vacio={
            datos.opciones.length === 0 ? (
              <VistaVacia
                titulo={unPlan ? "Todavía no armaste opciones" : "Todavía no elegiste planes"}
                texto={`Tocá ${unPlan ? "el plan" : "un plan de la lista"} y la cotización aparece acá, tal cual le va a llegar al cliente.`}
              />
            ) : null
          }
        />
      }
    >
      <div className="space-y-6">
        <Secciones actual={ramo} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-balance">{r.cotizacion.titulo}</h1>
            <p className="mt-1.5 max-w-[50ch] text-[15px] leading-relaxed text-suave">{r.cotizacion.bajada}</p>
          </div>
          {hayDatos && <BotonReiniciar onClick={reiniciar} />}
        </div>
      </div>

      <section aria-labelledby="titulo-cliente" className="space-y-4">
        <h2 id="titulo-cliente" className="text-base font-semibold">
          Cliente
        </h2>
        <Campo etiqueta={ramo === "comercio" ? "Titular" : "Nombre y apellido"}>
          <input
            className={estiloInput}
            value={datos.cliente}
            onChange={(e) => actualizar({ cliente: e.target.value })}
            placeholder={ramo === "comercio" ? "Ej.: Juan Pérez o la razón social" : "Ej.: María Gómez"}
            autoComplete="off"
            enterKeyHint="next"
          />
        </Campo>
        <div className={`grid gap-4 sm:gap-3 ${r.cotizacion.campos.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {r.cotizacion.campos.map((c) => (
            <CampoCotizacion
              key={c.id}
              campo={c}
              valor={datos.campos[c.id] ?? ""}
              onCambiar={(v) => actualizar({ campos: { ...datos.campos, [c.id]: v } })}
            />
          ))}
        </div>
        {r.cotizacion.monedas.length > 1 && (
          <fieldset className="flex min-w-0 flex-col sm:max-w-[50%] sm:pr-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-suave">Moneda</legend>
            <Segmentos
              opciones={MONEDAS_RAMO.filter((m) => r.cotizacion.monedas.includes(m.valor))}
              valor={datos.moneda}
              onCambiar={(moneda) => actualizar({ moneda })}
              etiqueta={(o) => `Póliza en ${o.texto.toLowerCase()}`}
            />
          </fieldset>
        )}
      </section>

      <section aria-labelledby="titulo-planes" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 id="titulo-planes" className="text-base font-semibold">
              {unPlan ? "Plan de La Segunda" : "Planes de La Segunda"}
            </h2>
            <p className="mt-1 text-[13px] text-suave">
              {unPlan ? "Tocá el plan para sumar una opción." : "Tocá un plan para sumarlo."}
            </p>
          </div>
          {r.cotizacion.periodos.length > 1 && (
            <label className="flex items-center gap-2 text-[13px] text-suave">
              Precios
              <select
                value={datos.periodo}
                onChange={(e) => actualizar({ periodo: e.target.value as PeriodoRamo })}
                className="h-9 rounded-full border border-linea bg-white pr-8 pl-3 text-[13px] font-medium text-tinta hover:border-[#dccdd2] focus:border-rojo focus:ring-[3px] focus:ring-rojo/15 focus-visible:outline-none"
              >
                {r.cotizacion.periodos.map((p) => (
                  <option key={p} value={p}>
                    {textoPeriodoRamo(p)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {datos.opciones.length >= MAX_OPCIONES_RAMO && (
          <p className="rounded-lg bg-rosa px-3.5 py-2.5 text-[13px] text-rojo-oscuro">
            Ya tenés {MAX_OPCIONES_RAMO} opciones. Quitá una para sumar otra.
          </p>
        )}

        <ol className="divide-y divide-linea overflow-hidden rounded-xl border border-linea">
          {r.planes.map((plan) => (
            <FilaPlan
              key={plan.codigo}
              ramo={r}
              plan={plan}
              datos={datos}
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

function CampoCotizacion({ campo, valor, onCambiar }: { campo: CampoRamo; valor: string; onCambiar: (v: string) => void }) {
  const aviso = avisoCampo(campo, valor);
  const edad = campo.tipo === "edad";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Campo etiqueta={campo.etiqueta} ayuda={aviso ? <MensajeError>{aviso}</MensajeError> : null}>
        <input
          className={`${estiloInput} ${edad ? "tabular-nums" : ""} ${aviso ? "border-rojo/60 hover:border-rojo/60" : ""}`}
          value={valor}
          onChange={(e) => onCambiar(edad ? e.target.value.replace(/\D/g, "").slice(0, 2) : e.target.value)}
          placeholder={campo.placeholder}
          inputMode={edad ? "numeric" : undefined}
          autoComplete="off"
          aria-invalid={!!aviso}
        />
      </Campo>
      {campo.sugerencias && <Sugerencias opciones={campo.sugerencias} valor={valor} onCambiar={onCambiar} />}
    </div>
  );
}

function Sugerencias({ opciones, valor, onCambiar }: { opciones: string[]; valor: string; onCambiar: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={valor === s}
          onClick={() => onCambiar(valor === s ? "" : s)}
          className="h-8 rounded-full border border-linea px-3 text-[13px] font-medium transition-colors duration-200 hover:border-rojo/50 aria-pressed:border-rojo aria-pressed:bg-rojo aria-pressed:text-white"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

type FilaPlanProps = {
  ramo: Ramo;
  plan: PlanRamo;
  datos: DatosRamo;
  enfocar: string | null;
  alEnfocar: () => void;
  onAgregar: () => void;
  onCambiar: (id: string, cambio: Partial<OpcionRamo>) => void;
  onQuitar: (id: string) => void;
};

function FilaPlan({ ramo, plan, datos, enfocar, alEnfocar, onAgregar, onCambiar, onQuitar }: FilaPlanProps) {
  const propias = datos.opciones.map((o, i) => ({ ...o, numero: i + 1 })).filter((o) => o.plan === plan.codigo);
  const elegido = propias.length > 0;
  const hayLugar = datos.opciones.length < MAX_OPCIONES_RAMO;
  const cubre = filasDe(ramo).filter((f) => enPlan(f, plan)).length;

  const contenido = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug font-semibold text-pretty">{plan.nombre}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-suave">
          {plan.tipo} · {cubre} coberturas
        </span>
      </span>
      {elegido ? (
        <span className="shrink-0 text-[13px] font-semibold text-rojo">{propias.map((o) => `Opción ${o.numero}`).join(" · ")}</span>
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
              ramo={ramo}
              plan={plan}
              opcion={o}
              numero={o.numero}
              datos={datos}
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
  ramo: Ramo;
  plan: PlanRamo;
  opcion: OpcionRamo;
  numero: number;
  datos: DatosRamo;
  enfocar: boolean;
  alEnfocar: () => void;
  onCambiar: (cambio: Partial<OpcionRamo>) => void;
  onQuitar: () => void;
};

function EditorOpcion({ ramo, plan, opcion, numero, datos, enfocar, alEnfocar, onCambiar, onQuitar }: EditorOpcionProps) {
  const precioRef = useRef<HTMLInputElement>(null);
  const moneda = datos.moneda;
  const plazo = ramo.cotizacion.plazo;
  const plazoFijo = plazo?.fijo[plan.codigo];
  const filas = filasDe(ramo).filter((f) => enPlan(f, plan));
  const fijas = filas.filter((f) => f.suma && !esOpcional(f, plan));
  const opcionales = filas.filter((f) => esOpcional(f, plan));
  const algunaRequerida = fijas.some((f) => f.requerida);

  useEffect(() => {
    if (!enfocar) return;
    precioRef.current?.focus();
    alEnfocar();
  }, [enfocar, alEnfocar]);

  const cambiarSuma = (id: string, valor: string) => onCambiar({ sumas: { ...opcion.sumas, [id]: valor } });
  const alternar = (f: FilaRamo, marcado: boolean) =>
    onCambiar({ incluidas: marcado ? [...opcion.incluidas, f.id] : opcion.incluidas.filter((x) => x !== f.id) });

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
          {simbolo(moneda)}
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
        <span className="pr-4 text-[13px] whitespace-nowrap text-suave">{textoPeriodoRamo(datos.periodo)}</span>
      </div>

      {plazo && (
        <div className="mt-4">
          {plazoFijo ? (
            <p className="text-[13px] text-suave">
              {plazo.etiqueta}: <span className="font-semibold text-tinta">{plazoFijo}</span>
            </p>
          ) : (
            <fieldset>
              <legend className="text-[13px] font-medium text-suave">{plazo.etiqueta}</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Sugerencias opciones={plazo.sugerencias} valor={opcion.plazo} onCambiar={(v) => onCambiar({ plazo: v })} />
                <input
                  value={plazo.sugerencias.includes(opcion.plazo) ? "" : opcion.plazo}
                  onChange={(e) => onCambiar({ plazo: e.target.value })}
                  placeholder="Otro"
                  aria-label={`${plazo.etiqueta} de la opción ${numero}`}
                  autoComplete="off"
                  className="h-8 w-32 rounded-full border border-linea bg-white px-3 text-[13px] font-medium placeholder:font-normal placeholder:text-[#7d7175] hover:border-[#dccdd2] focus:border-rojo focus:ring-[3px] focus:ring-rojo/15 focus-visible:outline-none"
                />
              </div>
            </fieldset>
          )}
        </div>
      )}

      {fijas.length > 0 && (
        <fieldset className="mt-4">
          <legend className="text-[13px] font-medium text-suave">
            Sumas aseguradas{algunaRequerida ? "" : " (opcional: lo que no cargues sale como incluido)"}
          </legend>
          <div className="mt-2 grid gap-x-3 gap-y-3 sm:grid-cols-2">
            {fijas.map((f) => (
              <CampoSuma
                key={f.id}
                fila={f}
                plan={plan}
                valor={opcion.sumas[f.id] ?? ""}
                moneda={moneda}
                numero={numero}
                onCambiar={(v) => cambiarSuma(f.id, v)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {opcionales.length > 0 && (
        <fieldset className="mt-4">
          <legend className="text-[13px] font-medium text-suave">
            {fijas.length > 0 ? "Coberturas adicionales" : "Coberturas de esta opción"}
          </legend>
          <ul className="mt-2 divide-y divide-linea rounded-lg border border-linea">
            {opcionales.map((f) => {
              const marcado = lleva(f, plan, opcion);
              const aviso = marcado ? avisoSuma(f, plan, opcion.sumas[f.id] ?? "", moneda) : null;
              return (
                <li key={f.id} className="px-3 py-2">
                  <div className="flex min-h-9 items-center gap-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-[14px] leading-snug">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={(e) => alternar(f, e.target.checked)}
                        className="size-4 shrink-0 cursor-pointer accent-rojo"
                      />
                      <span className="min-w-0">{f.nombre}</span>
                    </label>
                    {marcado && f.suma && (
                      <EntradaMonto
                        valor={opcion.sumas[f.id] ?? ""}
                        onCambiar={(v) => cambiarSuma(f.id, v)}
                        moneda={moneda}
                        etiqueta={`Suma de ${f.nombre.toLowerCase()} de la opción ${numero}`}
                        placeholder="Suma"
                        chico
                        invalido={!!aviso}
                      />
                    )}
                  </div>
                  {aviso && (
                    <div className="pt-1 pl-7">
                      <MensajeError>{aviso}</MensajeError>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
    </div>
  );
}

function CampoSuma({
  fila,
  plan,
  valor,
  moneda,
  numero,
  onCambiar,
}: {
  fila: FilaRamo;
  plan: PlanRamo;
  valor: string;
  moneda: DatosRamo["moneda"];
  numero: number;
  onCambiar: (v: string) => void;
}) {
  const aviso = avisoSuma(fila, plan, valor, moneda);
  const limites = fila.limites?.[plan.codigo];
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] leading-snug text-tinta">{fila.nombre}</span>
      <EntradaMonto
        valor={valor}
        onCambiar={onCambiar}
        moneda={moneda}
        etiqueta={`${fila.nombre} de la opción ${numero}`}
        sufijo={fila.unidad}
        invalido={!!aviso}
      />
      {aviso ? (
        <MensajeError>{aviso}</MensajeError>
      ) : limites ? (
        <span className="text-[12px] leading-snug text-suave">
          De {simbolo(moneda)} {limites[0].toLocaleString("es-AR")} a {simbolo(moneda)} {limites[1].toLocaleString("es-AR")}
        </span>
      ) : null}
    </div>
  );
}

function EntradaMonto({
  valor,
  onCambiar,
  moneda,
  etiqueta,
  sufijo,
  placeholder = "0",
  chico,
  invalido,
}: {
  valor: string;
  onCambiar: (v: string) => void;
  moneda: DatosRamo["moneda"];
  etiqueta: string;
  sufijo?: string;
  placeholder?: string;
  chico?: boolean;
  invalido?: boolean;
}) {
  return (
    <div
      className={`flex items-center border bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-rojo focus-within:ring-[3px] focus-within:ring-rojo/15 ${
        chico ? "h-9 w-40 shrink-0 rounded-full" : "h-11 rounded-lg"
      } ${invalido ? "border-rojo/60" : "border-linea hover:border-[#dccdd2]"}`}
    >
      <span className={`text-suave ${chico ? "pl-3 text-[13px] font-semibold" : "pl-3.5 text-[15px] font-medium"}`} aria-hidden>
        {simbolo(moneda)}
      </span>
      <input
        value={precioParaInput(valor)}
        onChange={(e) => onCambiar(normalizarPrecio(e.target.value.replace(/\./g, "")).split(",")[0])}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        aria-label={etiqueta}
        aria-invalid={invalido}
        className={`h-full w-0 min-w-0 flex-1 bg-transparent tabular-nums placeholder:font-normal placeholder:text-[#7d7175] focus-visible:outline-none ${
          chico ? "px-1.5 pr-3 text-[13px] font-semibold" : "px-3 text-[15px]"
        }`}
      />
      {sufijo && <span className="pr-3.5 text-[13px] whitespace-nowrap text-suave">{sufijo}</span>}
    </div>
  );
}
