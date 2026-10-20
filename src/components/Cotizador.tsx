"use client";

import Image from "next/image";
import { CircleAlert, Download, Eye, LoaderCircle, Plus, RotateCcw, Share2, Star, X } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { conBase } from "@/lib/rutas";

type Datos = Omit<Cotizacion, "numero" | "fecha">;
type Accion = "descargar" | "compartir" | "ver";

const DATOS_INICIALES: Datos = { cliente: "", vehiculo: "", anio: "", periodo: "mes", opciones: [] };

const MOSAICO = ["........cv", "......cvov", "....cv.vco", "..cvoc.ovo", "cvovcovcov"];
const COLOR_MOSAICO: Record<string, string> = {
  o: "bg-rojo-oscuro",
  v: "bg-rojo-vivo",
  c: "bg-rojo-claro",
  ".": "bg-transparent",
};

const estiloInput =
  "h-11 w-full rounded-lg border border-linea bg-white px-3.5 text-[15px] text-tinta placeholder:text-[#7d7175] transition-[border-color,box-shadow] duration-200 hover:border-[#dccdd2] focus:border-rojo focus:ring-[3px] focus:ring-rojo/15 focus-visible:outline-none";

function enumerar(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

async function armarArchivo(datos: Datos): Promise<File> {
  const fecha = new Date();
  const cotizacion: Cotizacion = { ...datos, fecha, numero: numeroCotizacion(fecha) };
  const { generarPDF } = await import("@/pdf/generar");
  const blob = await generarPDF(cotizacion);
  return new File([blob], nombreArchivo(cotizacion), { type: "application/pdf" });
}

function useMedia(consulta: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(consulta);
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

let archivoDePrueba: File | null = null;
function puedeCompartirArchivos(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  archivoDePrueba ??= new File([""], "prueba.pdf", { type: "application/pdf" });
  return navigator.canShare({ files: [archivoDePrueba] });
}
const sinSuscripcion = () => () => {};

function usePuedeCompartir(): boolean {
  return useSyncExternalStore(sinSuscripcion, puedeCompartirArchivos, () => false);
}

/** Regenera el PDF mientras se edita y mantiene el anterior visible hasta que el nuevo termina de cargar. */
function useVistaPrevia(datos: Datos, activa: boolean) {
  const [capas, setCapas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const pedido = useRef(0);

  useEffect(() => {
    if (!activa || datos.opciones.length === 0) return;
    const numero = ++pedido.current;
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const archivo = await armarArchivo(datos);
        if (numero !== pedido.current) return;
        const url = URL.createObjectURL(archivo);
        setCapas((previas) => {
          previas.slice(0, -1).forEach((u) => URL.revokeObjectURL(u));
          return [...previas.slice(-1), url];
        });
      } catch (error) {
        console.error("No se pudo armar la vista previa", error);
      } finally {
        if (numero === pedido.current) setCargando(false);
      }
    }, 350);
    return () => clearTimeout(espera);
  }, [datos, activa]);

  const alCargar = useCallback((url: string) => {
    setCapas((previas) => {
      const i = previas.indexOf(url);
      if (i <= 0) return previas;
      previas.slice(0, i).forEach((u) => URL.revokeObjectURL(u));
      return previas.slice(i);
    });
  }, []);

  return { capas, cargando, alCargar };
}

export function Cotizador() {
  const [datos, setDatos] = useState<Datos>(DATOS_INICIALES);
  const [enfocar, setEnfocar] = useState<string | null>(null);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [error, setError] = useState("");
  const escritorio = useMedia("(min-width: 1024px)");
  const puedeCompartir = usePuedeCompartir();
  const vista = useVistaPrevia(datos, escritorio);

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

  const actualizar = (cambio: Partial<Datos>) => {
    setError("");
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
    setError("");
  };

  const ejecutar = async (tipo: Accion) => {
    if (!lista || accion) return;
    setError("");
    setAccion(tipo);
    // La pestaña se abre antes de generar para que el navegador no la bloquee.
    const pestana = tipo === "ver" ? window.open("", "_blank") : null;
    if (tipo === "ver" && !pestana) {
      setAccion(null);
      setError("El navegador no dejó abrir una pestaña nueva. Probá con Descargar.");
      return;
    }
    try {
      const archivo = await armarArchivo(datos);
      if (tipo === "compartir") {
        const nombre = datos.cliente.trim().split(/\s+/)[0];
        await navigator.share({
          files: [archivo],
          title: archivo.name,
          text: `Hola ${nombre}, te paso la cotización del seguro para tu ${datos.vehiculo.trim()}.`,
        });
        return;
      }
      const url = URL.createObjectURL(archivo);
      if (pestana) {
        pestana.location.href = url;
      } else {
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = archivo.name;
        enlace.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      pestana?.close();
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setError("No se pudo generar el PDF. Probá de nuevo y, si sigue fallando, recargá la página.");
    } finally {
      setAccion(null);
    }
  };

  const estado = error
    ? error
    : lista
      ? `Lista para enviar · ${datos.opciones.length} ${datos.opciones.length === 1 ? "opción" : "opciones"}`
      : `Falta ${enumerar(falta)}.`;

  return (
    <div className="flex min-h-dvh flex-col">
      <Encabezado />

      <main className="mx-auto grid w-full max-w-[1680px] flex-1 grid-cols-1 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col bg-white lg:border-r lg:border-linea">
          <div className="flex-1 space-y-10 px-4 pt-8 pb-10 sm:px-8 lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-balance">Nueva cotización</h1>
                <p className="mt-1.5 max-w-[48ch] text-[15px] leading-relaxed text-suave">
                  Cargá el cliente y el vehículo, elegí hasta {MAX_OPCIONES} planes y poné el precio de cada uno.
                </p>
              </div>
              {hayDatos && (
                <button
                  type="button"
                  onClick={reiniciar}
                  aria-label="Empezar de nuevo"
                  className="inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium text-suave transition-colors hover:bg-fondo hover:text-tinta sm:w-auto sm:px-3"
                >
                  <RotateCcw size={14} aria-hidden />
                  <span className="hidden sm:inline">Empezar de nuevo</span>
                </button>
              )}
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
                  <p className="mt-1 text-[13px] text-suave">
                    De más a menos cobertura. Tocá un plan para sumarlo.
                  </p>
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
          </div>

          <div className="sticky bottom-0 z-10 border-t border-linea bg-white px-4 py-3 sm:px-8">
            <div className="flex items-center gap-3">
              <p
                aria-live="polite"
                className={`min-w-0 flex-1 text-[13px] leading-snug ${error ? "font-medium text-rojo" : "text-suave"}`}
              >
                {estado}
              </p>
              <div className="flex shrink-0 items-center gap-2 lg:hidden">
                <BotonSecundario onClick={() => ejecutar("ver")} disabled={!lista || !!accion} cargando={accion === "ver"}>
                  <Eye size={16} aria-hidden />
                  Ver
                </BotonSecundario>
                {puedeCompartir ? (
                  <BotonPrimario
                    onClick={() => ejecutar("compartir")}
                    disabled={!lista || !!accion}
                    cargando={accion === "compartir"}
                  >
                    <Share2 size={16} aria-hidden />
                    Compartir
                  </BotonPrimario>
                ) : (
                  <BotonPrimario
                    onClick={() => ejecutar("descargar")}
                    disabled={!lista || !!accion}
                    cargando={accion === "descargar"}
                  >
                    <Download size={16} aria-hidden />
                    Descargar
                  </BotonPrimario>
                )}
              </div>
              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                {puedeCompartir && (
                  <BotonSecundario
                    onClick={() => ejecutar("compartir")}
                    disabled={!lista || !!accion}
                    cargando={accion === "compartir"}
                  >
                    <Share2 size={16} aria-hidden />
                    Compartir
                  </BotonSecundario>
                )}
                <BotonPrimario
                  onClick={() => ejecutar("descargar")}
                  disabled={!lista || !!accion}
                  cargando={accion === "descargar"}
                >
                  <Download size={16} aria-hidden />
                  Descargar PDF
                </BotonPrimario>
              </div>
            </div>
          </div>
        </section>

        <aside aria-label="Vista previa del PDF" className="hidden min-h-0 flex-col bg-[#ece5e8] p-6 lg:flex xl:p-8">
          <div className="flex h-8 items-center justify-between pb-3">
            <h2 className="text-sm font-semibold">Así lo va a ver tu cliente</h2>
            {vista.cargando && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-suave">
                <LoaderCircle size={14} className="animate-spin" aria-hidden />
                Actualizando
              </span>
            )}
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-white shadow-[0_2px_4px_rgba(35,26,29,0.06),0_24px_48px_-24px_rgba(35,26,29,0.4)]">
            {datos.opciones.length === 0 ? (
              <VistaVacia />
            ) : vista.capas.length === 0 ? (
              <div className="grid h-full place-items-center text-[13px] text-suave">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle size={16} className="animate-spin" aria-hidden />
                  Armando el PDF…
                </span>
              </div>
            ) : (
              vista.capas.map((url, i) => {
                const visible = i === 0;
                return (
                  <iframe
                    key={url}
                    src={`${url}#toolbar=0&navpanes=0&view=FitH`}
                    title="Vista previa de la cotización"
                    onLoad={() => vista.alCargar(url)}
                    className={`absolute inset-0 h-full w-full ${visible ? "" : "pointer-events-none opacity-0"}`}
                  />
                );
              })
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Encabezado() {
  return (
    <header className="sticky top-0 z-20 bg-rojo text-white lg:static">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between pl-4 sm:pl-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Image
            src={conBase("/marca/logo-blanco.png")}
            alt="La Segunda Seguros"
            width={1891}
            height={435}
            priority
            className="h-6 w-auto sm:h-7"
          />
          <span className="border-l-[3px] border-white pl-3 text-[13px] font-bold tracking-[2px] whitespace-nowrap uppercase sm:text-base">
            Agencia Winifreda
          </span>
        </div>
        <Mosaico className="hidden sm:grid" />
      </div>
    </header>
  );
}

function Mosaico({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`grid h-16 w-40 grid-cols-10 grid-rows-5 ${className}`}>
      {MOSAICO.flatMap((fila, i) => fila.split("").map((c, j) => <span key={`${i}-${j}`} className={COLOR_MOSAICO[c]} />))}
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-suave">{etiqueta}</span>
      {children}
    </label>
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

function BotonPrimario({
  children,
  cargando,
  ...props
}: { children: ReactNode; cargando: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-rojo px-4 text-[15px] font-semibold whitespace-nowrap text-white shadow-[0_8px_18px_-8px_rgba(226,0,57,0.6)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-rojo-oscuro active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#ece3e6] disabled:text-[#7d7175] disabled:shadow-none sm:px-5"
    >
      {cargando ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
      {cargando ? "Generando…" : children}
    </button>
  );
}

function BotonSecundario({
  children,
  cargando,
  ...props
}: { children: ReactNode; cargando: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[15px] font-medium whitespace-nowrap text-tinta transition-colors duration-200 hover:border-[#dccdd2] hover:bg-fondo disabled:cursor-not-allowed disabled:text-[#7d7175] disabled:hover:bg-white sm:px-4"
    >
      {cargando ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
      {cargando ? "Generando…" : children}
    </button>
  );
}

function VistaVacia() {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div className="max-w-[34ch]">
        <div aria-hidden className="mx-auto grid w-24 grid-cols-5 grid-rows-3">
          {["...cv", ".cvov", "cvocv"].flatMap((fila, i) =>
            fila.split("").map((c, j) => <span key={`${i}-${j}`} className={`aspect-square ${c === "." ? "" : COLOR_MOSAICO[c]}`} />),
          )}
        </div>
        <p className="mt-6 text-base font-semibold">Todavía no elegiste planes</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-suave">
          Tocá un plan de la lista y la cotización aparece acá, tal cual le va a llegar al cliente.
        </p>
      </div>
    </div>
  );
}
