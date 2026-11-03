"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { normalizarPrecio, numeroCotizacion, precioParaInput } from "@/lib/cotizacion";
import {
  type Aviso,
  CULTIVOS,
  type CotizacionGranizo,
  type DatosGranizo,
  type EstadoGranizo,
  MONEDAS,
  PAGOS,
  PLANES,
  PROVINCIAS,
  RESIEMBRAS,
  calcularGranizo,
  datosInicialesGranizo,
  departamentos,
  faltantesGranizo,
  fechaCorta,
  formatearFecha,
  leerFecha,
  monedaDeshabilitada,
  monto,
  nombreArchivoGranizo,
  normalizar,
  opcionesCondicion,
  opcionesFranquicia,
  opcionesIibb,
  pagoDeshabilitado,
  pideParalelo,
  porcentaje,
  textoCultivo,
} from "@/lib/granizo";
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

async function armarArchivo(datos: DatosGranizo): Promise<File> {
  const fecha = new Date();
  const cotizacion: CotizacionGranizo = { ...datos, fecha, numero: numeroCotizacion(fecha) };
  const { generarPDFGranizo } = await import("@/pdf/generar");
  const blob = await generarPDFGranizo(cotizacion);
  return new File([blob], nombreArchivoGranizo(cotizacion), { type: "application/pdf" });
}

const estiloSelect = `${estiloInput} appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%236b5f63'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='m6%209%206%206%206-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9`;

export function CotizadorGranizo() {
  const [datos, setDatos] = useState<DatosGranizo>(datosInicialesGranizo);
  const escritorio = useMedia("(min-width: 1024px)");
  const puedeCompartir = usePuedeCompartir();

  // La fecha de hoy cambia la vigencia; se fija al montar para que el render del servidor coincida.
  const [hoy, setHoy] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setHoy(new Date()));
    return () => clearTimeout(t);
  }, []);

  const estado = useMemo(() => calcularGranizo(datos, hoy ?? new Date(2026, 0, 1)), [datos, hoy]);
  const hayVista = estado.tipo === "ok" && hoy !== null;
  const armar = useMemo(() => (hayVista ? () => armarArchivo(datos) : null), [datos, hayVista]);
  const vista = useVistaPrevia(armar, escritorio);

  // Solo en desarrollo: /granizo?demo precarga la cotización con la que se calibró el cálculo.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !window.location.search.includes("demo")) return;
    const t = setTimeout(() =>
      setDatos((d) => normalizar({ ...d, cliente: "Juan Pérez", hectareas: "150", valorHa: "400000", franquicia: "5o", siembra: "12/10/2026" })),
    );
    return () => clearTimeout(t);
  }, []);

  const falta = faltantesGranizo(datos, estado);
  const lista = falta.length === 0 && hoy !== null;
  const inicial = datosInicialesGranizo();
  const hayDatos = (Object.keys(inicial) as (keyof DatosGranizo)[]).some((k) => datos[k] !== inicial[k]);

  const acciones = useAccionesPDF(
    () => armarArchivo(datos),
    () => `Hola ${datos.cliente.trim().split(/\s+/)[0]}, te paso la cotización del seguro de granizo.`,
    lista,
  );

  const actualizar = (cambio: Partial<DatosGranizo>) => {
    acciones.limpiarError();
    setDatos((d) => normalizar({ ...d, ...cambio }));
  };

  const reiniciar = () => {
    if (hayDatos && !window.confirm("¿Borrar esta cotización y empezar una nueva?")) return;
    setDatos(datosInicialesGranizo());
    acciones.limpiarError();
  };

  const textoEstado = lista ? "Lista para enviar" : textoFaltantes(falta);
  const unidad = datos.moneda === "usd" ? "US$" : "$";
  const iibb = opcionesIibb(datos.provincia);
  const siembraInvalida = datos.siembra.length === 10 && !leerFecha(datos.siembra);

  return (
    <Pantalla
      barra={
        <BarraAcciones
          estado={textoEstado}
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
          titulo="Vista previa de la cotización de granizo"
          vacio={
            hayVista ? null : (
              <VistaVacia
                titulo={estado.tipo === "sin-tasa" ? "No hay tasa para esta combinación" : "Todavía no hay una cotización"}
                texto={
                  estado.tipo === "sin-tasa"
                    ? estado.texto
                    : "Elegí la zona y el cultivo, y cargá las hectáreas y el valor por hectárea. La cotización aparece acá, tal cual le va a llegar al cliente."
                }
              />
            )
          }
        />
      }
    >
      <div className="space-y-6">
        <Secciones actual="granizo" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-balance">Nueva cotización de granizo</h1>
            <p className="mt-1.5 max-w-[50ch] text-[15px] leading-relaxed text-suave">
              Cosecha Gruesa 2026/27. Tasas, recargos y resiembras de la circular 02/2026 de La Segunda. Es una referencia:
              el número que vale es el del sistema de propuestas.
            </p>
          </div>
          {hayDatos && <BotonReiniciar onClick={reiniciar} />}
        </div>
      </div>

      <Bloque id="cliente" titulo="Cliente y lote">
        <Campo etiqueta="Nombre y apellido">
          <input
            className={estiloInput}
            value={datos.cliente}
            onChange={(e) => actualizar({ cliente: e.target.value })}
            placeholder="Ej.: Juan Pérez"
            autoComplete="off"
            enterKeyHint="next"
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <Campo etiqueta="Provincia">
            <select className={estiloSelect} value={datos.provincia} onChange={(e) => actualizar({ provincia: e.target.value })}>
              {PROVINCIAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Departamento">
            <select className={estiloSelect} value={datos.depto} onChange={(e) => actualizar({ depto: e.target.value })}>
              {departamentos(datos.provincia).map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.texto}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        {pideParalelo(datos) && (
          <fieldset className="flex min-w-0 flex-col">
            <legend className="mb-1.5 text-[13px] font-medium text-suave">Ubicación respecto al paralelo 36°</legend>
            <Segmentos
              opciones={[
                { valor: "sur", texto: "Al sur" },
                { valor: "norte", texto: "Al norte" },
              ]}
              valor={datos.paralelo}
              onCambiar={(paralelo) => actualizar({ paralelo })}
              etiqueta={(o) => `${o.texto} del paralelo 36`}
            />
          </fieldset>
        )}
      </Bloque>

      <Bloque id="cultivo" titulo="Cultivo y cobertura">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <fieldset className="flex min-w-0 flex-col">
            <legend className="mb-1.5 text-[13px] font-medium text-suave">Cultivo</legend>
            <Segmentos opciones={CULTIVOS} valor={datos.cultivo} onCambiar={(cultivo) => actualizar({ cultivo })} etiqueta={(o) => o.texto} />
          </fieldset>
          <fieldset className="flex min-w-0 flex-col">
            <legend className="mb-1.5 text-[13px] font-medium text-suave">Cobertura</legend>
            <Segmentos
              opciones={PLANES.map((p) => ({ valor: p.valor, texto: p.corto }))}
              valor={datos.plan}
              onCambiar={(plan) => actualizar({ plan })}
              etiqueta={(o) => PLANES.find((p) => p.valor === o.valor)!.texto}
            />
          </fieldset>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <Campo
            etiqueta="Fecha de siembra"
            ayuda={siembraInvalida ? <MensajeError>Esa fecha no existe. Revisá el día y el mes.</MensajeError> : null}
          >
            <input
              className={`${estiloInput} tabular-nums ${siembraInvalida ? "border-rojo/60 hover:border-rojo/60" : ""}`}
              value={datos.siembra}
              onChange={(e) => actualizar({ siembra: formatearFecha(e.target.value) })}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={siembraInvalida}
            />
          </Campo>
          <Campo etiqueta="Franquicia">
            <select className={estiloSelect} value={datos.franquicia} onChange={(e) => actualizar({ franquicia: e.target.value })}>
              {opcionesFranquicia(datos.depto, datos.plan).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.texto}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Resiembra">
          <select
            className={estiloSelect}
            value={datos.resiembra}
            onChange={(e) => actualizar({ resiembra: e.target.value as DatosGranizo["resiembra"] })}
          >
            {RESIEMBRAS.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.texto} ({r.ajuste})
              </option>
            ))}
          </select>
        </Campo>
      </Bloque>

      <Bloque id="suma" titulo="Superficie y suma asegurada">
        <fieldset className="flex min-w-0 flex-col">
          <legend className="mb-1.5 text-[13px] font-medium text-suave">Moneda de la póliza</legend>
          <Segmentos
            opciones={MONEDAS}
            valor={datos.moneda}
            onCambiar={(moneda) => actualizar({ moneda })}
            etiqueta={(o) => `Póliza en ${o.texto.toLowerCase()}`}
            deshabilitada={(m) => monedaDeshabilitada(datos, m)}
          />
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <Campo etiqueta="Hectáreas">
            <EntradaNumero valor={datos.hectareas} onCambiar={(hectareas) => actualizar({ hectareas })} sufijo="ha" />
          </Campo>
          {datos.moneda === "qq" ? (
            <Campo etiqueta="Quintales por hectárea" ayuda={<Ayuda>Mínimo 3 qq/ha.</Ayuda>}>
              <EntradaNumero valor={datos.qqHa} onCambiar={(qqHa) => actualizar({ qqHa })} sufijo="qq/ha" decimales />
            </Campo>
          ) : (
            <Campo etiqueta="Valor por hectárea">
              <EntradaNumero valor={datos.valorHa} onCambiar={(valorHa) => actualizar({ valorHa })} prefijo={unidad} />
            </Campo>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <Campo etiqueta="Rinde esperado (opcional)" ayuda={<Ayuda>Para controlar el tope del 80%.</Ayuda>}>
            <EntradaNumero valor={datos.rinde} onCambiar={(rinde) => actualizar({ rinde })} sufijo="qq/ha" decimales placeholder="Ej.: 22" />
          </Campo>
          <Campo etiqueta="Precio del quintal (opcional)" ayuda={<Ayuda>Para pasar el valor a quintales.</Ayuda>}>
            <EntradaNumero valor={datos.precioQq} onCambiar={(precioQq) => actualizar({ precioQq })} prefijo={unidad} placeholder="Ej.: 450.000" />
          </Campo>
        </div>
      </Bloque>

      <Bloque id="pago" titulo="Pago y tomador">
        <fieldset className="flex min-w-0 flex-col">
          <legend className="mb-1.5 text-[13px] font-medium text-suave">Forma de pago</legend>
          <Segmentos
            opciones={PAGOS.map((p) => ({ valor: p.valor, texto: p.corto }))}
            valor={datos.pago}
            onCambiar={(pago) => actualizar({ pago })}
            etiqueta={(o) => PAGOS.find((p) => p.valor === o.valor)!.texto}
            deshabilitada={(p) => pagoDeshabilitado(datos, p)}
          />
          {datos.cultivo === "g" && <Ayuda className="mt-1.5">Plan Canje no está disponible para girasol.</Ayuda>}
        </fieldset>
        <div className={`grid gap-4 sm:gap-3 ${iibb.length ? "sm:grid-cols-2" : ""}`}>
          <Campo etiqueta={datos.pago === "canje" ? "Registro de Operadores" : "Condición frente al IVA"}>
            <select className={estiloSelect} value={datos.condicion} onChange={(e) => actualizar({ condicion: e.target.value })}>
              {opcionesCondicion(datos.pago).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.texto}
                </option>
              ))}
            </select>
          </Campo>
          {iibb.length > 0 && (
            <Campo etiqueta="Ingresos Brutos">
              <select className={estiloSelect} value={datos.iibb} onChange={(e) => actualizar({ iibb: e.target.value })}>
                {iibb.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </select>
            </Campo>
          )}
        </div>
      </Bloque>

      <Bloque id="extras" titulo="Adicionales y descuentos">
        <div className="space-y-3">
          <Tilde marcado={datos.polizaPrevia} onCambiar={(polizaPrevia) => actualizar({ polizaPrevia })}>
            Tuvo póliza la campaña pasada: cubre a los 3 días
          </Tilde>
          {!datos.polizaPrevia && (
            <Tilde marcado={datos.reduccionCarencia} onCambiar={(reduccionCarencia) => actualizar({ reduccionCarencia })} sangria>
              Reducir la carencia de 5 a 3 días (cuesta un 10% más)
            </Tilde>
          )}
          <Tilde marcado={datos.planchado} onCambiar={(planchado) => actualizar({ planchado })}>
            Planchado de suelos, con extra prima
          </Tilde>
          {datos.planchado && (
            <div className="animate-despliegue space-y-3 pl-7">
              <Tilde marcado={datos.planchadoPrimera} onCambiar={(planchadoPrimera) => actualizar({ planchadoPrimera })}>
                Cultivo de primera: sin trigo, cebada u otro cultivo de invierno antes en el lote
              </Tilde>
              <Tilde marcado={datos.planchadoSuelo} onCambiar={(planchadoSuelo) => actualizar({ planchadoSuelo })}>
                Suelo clase I, II o III según la carta de suelos del INTA
              </Tilde>
              <Campo etiqueta="Extra prima de planchado" ayuda={<Ayuda>Porcentaje sobre la suma asegurada. Confirmalo en el sistema.</Ayuda>}>
                <EntradaNumero
                  valor={datos.planchadoTasa}
                  onCambiar={(planchadoTasa) => actualizar({ planchadoTasa })}
                  sufijo="%"
                  decimales
                  placeholder="Ej.: 0,50"
                />
              </Campo>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <Campo etiqueta="Descuento de la agencia" ayuda={<Ayuda>Se suma al otro descuento, sobre la tasa.</Ayuda>}>
            <EntradaNumero
              valor={datos.descuentoAgencia}
              onCambiar={(descuentoAgencia) => actualizar({ descuentoAgencia })}
              sufijo="%"
              decimales
              placeholder="0"
            />
          </Campo>
          <Campo etiqueta="Descuento de La Segunda" ayuda={<Ayuda>Hasta 10% (más 5% de ciclo productivo). Se suma al otro.</Ayuda>}>
            <EntradaNumero
              valor={datos.descuentoLaSegunda}
              onCambiar={(descuentoLaSegunda) => actualizar({ descuentoLaSegunda })}
              sufijo="%"
              decimales
              placeholder="0"
            />
          </Campo>
        </div>
      </Bloque>

      <Resultado estado={estado} datos={datos} listo={hoy !== null} />
    </Pantalla>
  );
}

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`titulo-${id}`} className="space-y-4">
      <h2 id={`titulo-${id}`} className="text-base font-semibold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Ayuda({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`text-[13px] leading-snug text-suave ${className}`}>{children}</span>;
}

/** Número con separador de miles mientras se tipea; con `decimales` acepta coma. */
function EntradaNumero({
  valor,
  onCambiar,
  prefijo,
  sufijo,
  decimales,
  placeholder = "0",
}: {
  valor: string;
  onCambiar: (v: string) => void;
  prefijo?: string;
  sufijo?: string;
  decimales?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex h-11 items-center rounded-lg border border-linea bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-rojo focus-within:ring-[3px] focus-within:ring-rojo/15 hover:border-[#dccdd2]">
      {prefijo && (
        <span className="pl-3.5 text-[15px] font-medium text-suave" aria-hidden>
          {prefijo}
        </span>
      )}
      <input
        value={precioParaInput(valor)}
        onChange={(e) => {
          const limpio = normalizarPrecio(e.target.value.replace(/\./g, ""));
          onCambiar(decimales ? limpio : limpio.split(",")[0]);
        }}
        inputMode={decimales ? "decimal" : "numeric"}
        autoComplete="off"
        placeholder={placeholder}
        className="h-full w-0 min-w-0 flex-1 bg-transparent px-3 text-[15px] tabular-nums placeholder:text-[#7d7175] focus-visible:outline-none"
      />
      {sufijo && <span className="pr-3.5 text-[13px] whitespace-nowrap text-suave">{sufijo}</span>}
    </div>
  );
}

function Tilde({ marcado, onCambiar, children, sangria }: { marcado: boolean; onCambiar: (v: boolean) => void; children: ReactNode; sangria?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 text-[14px] leading-snug ${sangria ? "pl-7" : ""}`}>
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => onCambiar(e.target.checked)}
        className="mt-[1px] size-4 shrink-0 cursor-pointer accent-rojo"
      />
      <span>{children}</span>
    </label>
  );
}

const ESTILO_AVISO: Record<Aviso["tipo"], string> = {
  error: "bg-rosa text-rojo-oscuro",
  alerta: "bg-[#fff6e5] text-[#7a4b00]",
  info: "bg-fondo text-suave",
};

function Resultado({ estado, datos, listo }: { estado: EstadoGranizo; datos: DatosGranizo; listo: boolean }) {
  const [detalle, setDetalle] = useState(false);
  if (estado.tipo === "sin-tasa")
    return (
      <p className="rounded-lg bg-rosa px-3.5 py-3">
        <MensajeError>{estado.texto}</MensajeError>
      </p>
    );
  if (estado.tipo !== "ok")
    return (
      <p className="rounded-lg bg-fondo px-3.5 py-3 text-[13px] leading-snug text-suave">
        Con las hectáreas y el {datos.moneda === "qq" ? "rinde asegurado por hectárea" : "valor por hectárea"}, acá aparece el premio.
      </p>
    );

  const u = datos.moneda;
  const ha = Number(datos.hectareas) || 1;
  return (
    <section aria-labelledby="titulo-resultado" className="space-y-3">
      <h2 id="titulo-resultado" className="text-base font-semibold">
        Resultado
      </h2>
      <div className="rounded-xl bg-rosa px-4 py-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[12px] font-medium text-rojo-oscuro">Premio · {textoCultivo(datos.cultivo)}</dt>
            <dd className="text-2xl font-bold tracking-[-0.02em] text-tinta tabular-nums">{monto(estado.premio, u)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium text-suave">Por hectárea</dt>
            <dd className="text-[15px] font-semibold tabular-nums">{monto(estado.premio / ha, u)}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium text-suave">Sobre la suma</dt>
            <dd className="text-[15px] font-semibold tabular-nums">
              {estado.sumaAsegurada ? porcentaje((estado.premio / estado.sumaAsegurada) * 100) : "—"}
            </dd>
          </div>
        </dl>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#f6d5dd] pt-3 text-[13px] sm:grid-cols-3">
          <Dato titulo="Prima" valor={monto(estado.prima, u)} />
          <Dato titulo="Suma asegurada" valor={monto(estado.sumaAsegurada, u)} />
          <Dato titulo="Recargo" valor={estado.recargo == null ? "Sin dato" : porcentaje(estado.recargo)} />
          <Dato titulo="Cubre granizo desde" valor={listo ? fechaCorta(estado.inicio) : "—"} />
          {estado.inicioViento && <Dato titulo={datos.plan === "h" ? "Cubre viento y helada desde" : "Cubre viento desde"} valor={listo ? fechaCorta(estado.inicioViento) : "—"} />}
          <Dato titulo="Hasta" valor={estado.fin ? fechaCorta(estado.fin) : "Falta la siembra"} />
        </dl>
      </div>

      <button
        type="button"
        aria-expanded={detalle}
        onClick={() => setDetalle((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-suave transition-colors hover:bg-fondo hover:text-tinta"
      >
        <ChevronDown size={14} aria-hidden className={`transition-transform duration-200 ${detalle ? "rotate-180" : ""}`} />
        {detalle ? "Ocultar el cálculo" : "Ver cómo se calculó"}
      </button>
      {detalle && (
        <table className="animate-despliegue w-full text-[13px]">
          <tbody>
            {estado.lineas.map(([a, b]) => (
              <tr key={a} className="border-b border-dashed border-linea">
                <td className="py-1.5 pr-3 text-suave">{a}</td>
                <td className="py-1.5 text-right font-medium whitespace-nowrap tabular-nums">{b}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-tinta font-semibold">
              <td className="pt-2">Premio</td>
              <td className="pt-2 text-right tabular-nums">{monto(estado.premio, u)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {estado.avisos.length > 0 && (
        <ul className="space-y-2">
          {estado.avisos.map((a) => (
            <li key={a.texto} className={`rounded-lg px-3.5 py-2.5 text-[13px] leading-snug ${ESTILO_AVISO[a.tipo]}`}>
              {a.texto}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-suave">{titulo}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}
