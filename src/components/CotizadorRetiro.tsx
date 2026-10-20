"use client";

import { CircleAlert, Minus, Plus, Star, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { numeroCotizacion, precioParaInput } from "@/lib/cotizacion";
import {
  type CotizacionRetiro,
  type Escenario,
  type EstadoEscenario,
  MAX_ESCENARIOS,
  MONEDAS,
  type Moneda,
  PARAMETROS_RETIRO,
  SEXOS,
  type Sexo,
  edadRetiroSugerida,
  estadoEscenario,
  estadoNacimiento,
  faltantesRetiro,
  formatearNacimiento,
  limitesAporte,
  montoParaMostrar,
  nombreArchivoRetiro,
  rangoEdadRetiro,
  simboloMoneda,
  textoMoneda,
  textoPlazo,
  textoPorcentaje,
  textoTasa,
} from "@/lib/retiro";
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

type Datos = Omit<CotizacionRetiro, "numero" | "fecha">;

const nuevoEscenario = (edadRetiro: number, id: string = crypto.randomUUID()): Escenario => ({
  id,
  aporte: "",
  edadRetiro: String(edadRetiro),
  recomendada: false,
});

// La primera opción tiene id fijo para que el HTML pre-renderizado coincida con el del navegador.
function datosIniciales(): Datos {
  return { cliente: "", nacimiento: "", sexo: "", moneda: "ARS", escenarios: [nuevoEscenario(edadRetiroSugerida(null), "inicial")] };
}

async function armarArchivo(datos: Datos): Promise<File> {
  const fecha = new Date();
  const cotizacion: CotizacionRetiro = { ...datos, fecha, numero: numeroCotizacion(fecha) };
  const { generarPDFRetiro } = await import("@/pdf/generar");
  const blob = await generarPDFRetiro(cotizacion);
  return new File([blob], nombreArchivoRetiro(cotizacion), { type: "application/pdf" });
}

export function CotizadorRetiro() {
  const [datos, setDatos] = useState<Datos>(datosIniciales);
  const [enfocar, setEnfocar] = useState<string | null>(null);
  const escritorio = useMedia("(min-width: 1024px)");
  const puedeCompartir = usePuedeCompartir();

  const hoy = new Date();
  const nacimiento = estadoNacimiento(datos.nacimiento, hoy);
  const fechaNacimiento = nacimiento.tipo === "ok" ? nacimiento.fecha : null;
  const estados = datos.escenarios.map((e) => estadoEscenario(datos, e, hoy));
  const calculables = estados.filter((e) => e.tipo === "ok").length;

  // La vista previa muestra las opciones que ya se pueden calcular, aunque falten otras.
  const hayVista = calculables > 0;
  const armar = useMemo(() => (hayVista ? () => armarArchivo(datos) : null), [datos, hayVista]);
  const vista = useVistaPrevia(armar, escritorio);

  // Solo en desarrollo: /retiro?demo precarga una proyección de ejemplo para revisar el PDF.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !window.location.search.includes("demo")) return;
    const una = window.location.search.includes("demo=1");
    const ahora = setTimeout(() =>
      setDatos({
        cliente: "María Gómez",
        nacimiento: "15/03/1990",
        sexo: "F",
        moneda: "ARS",
        escenarios: una
          ? [{ id: "demo-1", aporte: "50000", edadRetiro: "65", recomendada: false }]
          : [
              { id: "demo-1", aporte: "30000", edadRetiro: "65", recomendada: false },
              { id: "demo-2", aporte: "50000", edadRetiro: "65", recomendada: true },
              { id: "demo-3", aporte: "50000", edadRetiro: "60", recomendada: false },
            ],
      }),
    );
    return () => clearTimeout(ahora);
  }, []);

  const falta = faltantesRetiro(datos, hoy);
  const lista = falta.length === 0;
  const hayDatos = Boolean(
    datos.cliente || datos.nacimiento || datos.sexo || datos.escenarios.some((e) => e.aporte) || datos.escenarios.length !== 1,
  );

  const acciones = useAccionesPDF(
    () => armarArchivo(datos),
    () => `Hola ${datos.cliente.trim().split(/\s+/)[0]}, te paso la proyección de tu seguro de retiro.`,
    lista,
  );

  const actualizar = (cambio: Partial<Datos>) => {
    acciones.limpiarError();
    setDatos((d) => ({ ...d, ...cambio }));
  };

  const cambiarEscenario = (id: string, cambio: Partial<Escenario>) => {
    actualizar({
      escenarios: datos.escenarios.map((e) => {
        if (e.id === id) return { ...e, ...cambio };
        return cambio.recomendada ? { ...e, recomendada: false } : e;
      }),
    });
  };

  // Una opción nueva arranca igual que la anterior: lo habitual es cambiar solo el aporte o solo la edad.
  const agregar = () => {
    if (datos.escenarios.length >= MAX_ESCENARIOS) return;
    const ultima = datos.escenarios.at(-1);
    const nueva = ultima
      ? { ...ultima, id: crypto.randomUUID(), recomendada: false }
      : nuevoEscenario(edadRetiroSugerida(fechaNacimiento, hoy));
    actualizar({ escenarios: [...datos.escenarios, nueva] });
    setEnfocar(nueva.id);
  };

  const quitar = (id: string) => actualizar({ escenarios: datos.escenarios.filter((e) => e.id !== id) });

  const reiniciar = () => {
    if (hayDatos && !window.confirm("¿Borrar esta proyección y empezar una nueva?")) return;
    setDatos(datosIniciales());
    acciones.limpiarError();
  };

  const n = datos.escenarios.length;
  const estado = lista ? `Lista para enviar · ${n} ${n === 1 ? "opción" : "opciones"}` : textoFaltantes(falta);
  const limites = limitesAporte(datos.moneda);
  const rango = rangoEdadRetiro(fechaNacimiento, hoy);

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
          titulo="Vista previa de la proyección de retiro"
          vacio={
            hayVista ? null : (
              <VistaVacia
                titulo="Todavía no hay una proyección"
                texto="Completá la fecha de nacimiento, el sexo y cuánto quiere ahorrar por mes. La proyección aparece acá, tal cual le va a llegar al cliente."
              />
            )
          }
        />
      }
    >
      <div className="space-y-6">
        <Secciones actual="retiro" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-balance">Nueva proyección de retiro</h1>
            <p className="mt-1.5 max-w-[50ch] text-[15px] leading-relaxed text-suave">
              Cargá al cliente y armá hasta {MAX_ESCENARIOS} opciones de ahorro en el plan Futuro Protegido. La renta se
              calcula como en el cotizador online de La Segunda, descontando los gastos del plan.
            </p>
          </div>
          {hayDatos && <BotonReiniciar onClick={reiniciar} />}
        </div>
      </div>

      <section aria-labelledby="titulo-cliente" className="space-y-4">
        <h2 id="titulo-cliente" className="text-base font-semibold">
          Cliente
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
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-3">
          <Campo etiqueta="Fecha de nacimiento" ayuda={<AyudaNacimiento estado={nacimiento} />}>
            <input
              className={`${estiloInput} tabular-nums ${aviso(nacimiento.tipo === "invalida" || nacimiento.tipo === "fuera-de-rango")}`}
              value={datos.nacimiento}
              onChange={(e) => actualizar({ nacimiento: formatearNacimiento(e.target.value) })}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={nacimiento.tipo === "invalida" || nacimiento.tipo === "fuera-de-rango"}
            />
          </Campo>
          <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-suave">Sexo que figura en el DNI</legend>
            <Segmentos
              opciones={SEXOS}
              valor={datos.sexo}
              onCambiar={(sexo: Sexo) => actualizar({ sexo })}
              etiqueta={(o) => `Sexo ${o.texto}`}
            />
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="titulo-ahorro" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div>
            <h2 id="titulo-ahorro" className="text-base font-semibold">
              Opciones de ahorro
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-suave">
              De {montoParaMostrar(limites.minimo, datos.moneda)} a {montoParaMostrar(limites.maximo, datos.moneda)} por
              mes · proyección al {textoTasa(datos.moneda)} anual {textoMoneda(datos.moneda)} · mínimo garantizado{" "}
              {textoPorcentaje(PARAMETROS_RETIRO.tasaGarantizada[datos.moneda])}
            </p>
          </div>
          <div className="w-44">
            <Segmentos
              opciones={MONEDAS}
              valor={datos.moneda}
              onCambiar={(moneda: Moneda) => actualizar({ moneda })}
              etiqueta={(o) => `Ahorro en ${o.texto.toLowerCase()}`}
              chico
            />
          </div>
        </div>

        {datos.escenarios.map((e, i) => (
          <EditorEscenario
            key={e.id}
            escenario={e}
            numero={i + 1}
            estado={estados[i]}
            moneda={datos.moneda}
            rango={rango}
            enfocar={enfocar === e.id}
            alEnfocar={() => setEnfocar(null)}
            onCambiar={(cambio) => cambiarEscenario(e.id, cambio)}
            onQuitar={datos.escenarios.length > 1 ? () => quitar(e.id) : undefined}
          />
        ))}

        {datos.escenarios.length < MAX_ESCENARIOS ? (
          <button
            type="button"
            onClick={agregar}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-[#dccdd2] px-4 text-[13px] font-medium text-rojo-oscuro transition-colors hover:border-rojo hover:bg-rosa/60"
          >
            <Plus size={14} aria-hidden />
            Sumar otra opción para comparar
          </button>
        ) : (
          <p className="rounded-lg bg-rosa px-3.5 py-2.5 text-[13px] text-rojo-oscuro">
            Ya tenés {MAX_ESCENARIOS} opciones. Quitá una para sumar otra.
          </p>
        )}

        <p className="text-[13px] leading-relaxed text-suave">
          Para otros aportes o edades, La Segunda atiende en{" "}
          <a href="mailto:retiro@lasegunda.com.ar" className="font-medium text-tinta underline decoration-linea underline-offset-2 hover:decoration-rojo">
            retiro@lasegunda.com.ar
          </a>
          .
        </p>
      </section>
    </Pantalla>
  );
}

const aviso = (hay: boolean) => (hay ? "border-rojo/60 hover:border-rojo/60" : "");

function AyudaNacimiento({ estado }: { estado: ReturnType<typeof estadoNacimiento> }) {
  const { minima, maxima } = PARAMETROS_RETIRO.edadContratacion;
  if (estado.tipo === "ok") return <span className="text-[13px] text-suave tabular-nums">{estado.edad} años</span>;
  if (estado.tipo === "invalida") return <MensajeError>Esa fecha no existe. Revisá el día y el mes.</MensajeError>;
  if (estado.tipo === "fuera-de-rango")
    return (
      <MensajeError>
        Tiene {estado.edad} años. Se puede contratar de {minima} a {maxima}.
      </MensajeError>
    );
  return null;
}

function MensajeError({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-start gap-1.5 text-[13px] leading-snug text-rojo-oscuro">
      <CircleAlert size={14} className="mt-[2px] shrink-0" aria-hidden />
      <span>{children}</span>
    </span>
  );
}

type SegmentosProps<T extends string> = {
  opciones: { valor: T; texto: string }[];
  valor: T | "";
  onCambiar: (valor: T) => void;
  etiqueta: (o: { valor: T; texto: string }) => string;
  chico?: boolean;
};

/** Botones unidos para elegir una sola opción (sexo, moneda). */
function Segmentos<T extends string>({ opciones, valor, onCambiar, etiqueta, chico }: SegmentosProps<T>) {
  return (
    <div className={`grid gap-1 bg-fondo p-1 ${chico ? "h-9 rounded-full" : "h-11 rounded-lg"}`} style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          aria-label={etiqueta(o)}
          onClick={() => onCambiar(o.valor)}
          className={`text-[14px] font-semibold text-suave transition-colors duration-200 hover:text-tinta aria-pressed:bg-white aria-pressed:text-rojo aria-pressed:shadow-[0_1px_2px_rgba(35,26,29,0.08),0_4px_10px_-6px_rgba(35,26,29,0.25)] ${chico ? "rounded-full text-[13px]" : "rounded-md"}`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

type EditorEscenarioProps = {
  escenario: Escenario;
  numero: number;
  estado: EstadoEscenario;
  moneda: Moneda;
  rango: { minima: number; maxima: number };
  enfocar: boolean;
  alEnfocar: () => void;
  onCambiar: (cambio: Partial<Escenario>) => void;
  onQuitar?: () => void;
};

function EditorEscenario({ escenario, numero, estado, moneda, rango, enfocar, alEnfocar, onCambiar, onQuitar }: EditorEscenarioProps) {
  const aporteRef = useRef<HTMLInputElement>(null);
  const edad = Number(escenario.edadRetiro) || 0;
  const errorAporte = estado.tipo === "aporte-fuera-de-rango";
  const errorEdad = estado.tipo === "edad-fuera-de-rango";

  useEffect(() => {
    if (!enfocar) return;
    aporteRef.current?.select();
    aporteRef.current?.focus();
    alEnfocar();
  }, [enfocar, alEnfocar]);

  const moverEdad = (paso: number) => {
    const base = edad || rango.minima;
    const nueva = Math.min(Math.max(base + paso, rango.minima), rango.maxima);
    onCambiar({ edadRetiro: String(nueva) });
  };

  return (
    <div
      className={`animate-despliegue rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(35,26,29,0.04),0_8px_20px_-12px_rgba(35,26,29,0.18)] ${
        escenario.recomendada ? "border-rojo/40" : "border-linea"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-rojo">Opción {numero}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={escenario.recomendada}
            onClick={() => onCambiar({ recomendada: !escenario.recomendada })}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-suave transition-colors duration-200 hover:bg-fondo hover:text-tinta aria-pressed:bg-rojo aria-pressed:text-white aria-pressed:hover:bg-rojo-oscuro aria-pressed:hover:text-white"
          >
            <Star size={14} aria-hidden fill={escenario.recomendada ? "currentColor" : "none"} />
            Recomendada
          </button>
          {onQuitar && (
            <button
              type="button"
              onClick={onQuitar}
              aria-label={`Quitar opción ${numero}`}
              className="grid size-8 place-items-center rounded-full text-suave transition-colors hover:bg-fondo hover:text-tinta"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_168px]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[13px] font-medium text-suave" id={`aporte-${escenario.id}`}>
            Ahorro mensual
          </span>
          <div
            className={`flex h-14 items-center rounded-lg border bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-rojo focus-within:ring-[3px] focus-within:ring-rojo/15 hover:border-[#dccdd2] ${
              errorAporte ? "border-rojo/60" : "border-linea"
            }`}
          >
            <span className="pl-4 text-lg font-semibold whitespace-nowrap text-suave" aria-hidden>
              {simboloMoneda(moneda)}
            </span>
            <input
              ref={aporteRef}
              aria-labelledby={`aporte-${escenario.id}`}
              aria-invalid={errorAporte}
              value={precioParaInput(escenario.aporte)}
              onChange={(e) => onCambiar({ aporte: e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9) })}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className="h-full w-0 min-w-0 flex-1 bg-transparent px-2 text-2xl font-bold tracking-[-0.02em] tabular-nums placeholder:text-[#7d7175] focus-visible:outline-none"
            />
            <span className="pr-4 text-[13px] whitespace-nowrap text-suave">por mes</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[13px] font-medium text-suave" id={`edad-${escenario.id}`}>
            Edad de retiro
          </span>
          <div
            className={`flex h-14 items-center rounded-lg border bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-rojo focus-within:ring-[3px] focus-within:ring-rojo/15 hover:border-[#dccdd2] ${
              errorEdad ? "border-rojo/60" : "border-linea"
            }`}
          >
            <button
              type="button"
              onClick={() => moverEdad(-1)}
              disabled={edad <= rango.minima}
              aria-label="Un año menos"
              className="ml-1.5 grid size-9 shrink-0 place-items-center rounded-md text-suave transition-colors hover:bg-fondo hover:text-tinta disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <Minus size={16} aria-hidden />
            </button>
            <input
              aria-labelledby={`edad-${escenario.id}`}
              aria-invalid={errorEdad}
              value={escenario.edadRetiro}
              onChange={(e) => onCambiar({ edadRetiro: e.target.value.replace(/\D/g, "").slice(0, 2) })}
              inputMode="numeric"
              autoComplete="off"
              className="h-full w-0 min-w-0 flex-1 bg-transparent text-center text-2xl font-bold tracking-[-0.02em] tabular-nums focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => moverEdad(1)}
              disabled={edad >= rango.maxima}
              aria-label="Un año más"
              className="mr-1.5 grid size-9 shrink-0 place-items-center rounded-md text-suave transition-colors hover:bg-fondo hover:text-tinta disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <Plus size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <Resultado estado={estado} moneda={moneda} />
    </div>
  );
}

function Resultado({ estado, moneda }: { estado: EstadoEscenario; moneda: Moneda }) {
  if (estado.tipo === "aporte-fuera-de-rango")
    return (
      <p className="mt-3">
        <MensajeError>
          El aporte {textoMoneda(moneda)} va de {montoParaMostrar(estado.minimo, moneda)} a{" "}
          {montoParaMostrar(estado.maximo, moneda)} por mes.
        </MensajeError>
      </p>
    );
  if (estado.tipo === "edad-fuera-de-rango")
    return (
      <p className="mt-3">
        <MensajeError>
          Para este cliente, la edad de retiro va de {estado.minima} a {estado.maxima} años.
        </MensajeError>
      </p>
    );
  if (estado.tipo !== "ok")
    return (
      <p className="mt-3 rounded-lg bg-fondo px-3.5 py-3 text-[13px] leading-snug text-suave">
        {estado.tipo === "faltan-datos"
          ? "Con la fecha de nacimiento y el sexo, acá aparece la renta estimada."
          : "Poné cuánto quiere ahorrar por mes y a qué edad se retira."}
      </p>
    );

  const { resultado, totalAportado } = estado;
  return (
    <div className="mt-3 rounded-lg bg-rosa px-3.5 py-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[12px] font-medium text-rojo-oscuro">Renta mensual estimada</dt>
          <dd className="text-xl font-bold tracking-[-0.02em] text-tinta tabular-nums">
            {montoParaMostrar(resultado.rentaMensual, moneda)}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium text-suave">Fondos acumulados</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{montoParaMostrar(resultado.fondosAcumulados, moneda)}</dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium text-suave">Tiempo de ahorro</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{textoPlazo(resultado.mesesDeAporte)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[12px] text-suave tabular-nums">Total aportado: {montoParaMostrar(totalAportado, moneda)}</p>
    </div>
  );
}
