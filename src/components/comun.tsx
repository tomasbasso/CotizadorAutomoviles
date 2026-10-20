"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Eye, LoaderCircle, RotateCcw, Share2 } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { conBase } from "@/lib/rutas";

export type Accion = "descargar" | "compartir" | "ver";

export const MOSAICO = ["........cv", "......cvov", "....cv.vco", "..cvoc.ovo", "cvovcovcov"];
export const COLOR_MOSAICO: Record<string, string> = {
  o: "bg-rojo-oscuro",
  v: "bg-rojo-vivo",
  c: "bg-rojo-claro",
  ".": "bg-transparent",
};

export const estiloInput =
  "h-11 w-full rounded-lg border border-linea bg-white px-3.5 text-[15px] text-tinta placeholder:text-[#7d7175] transition-[border-color,box-shadow] duration-200 hover:border-[#dccdd2] focus:border-rojo focus:ring-[3px] focus:ring-rojo/15 focus-visible:outline-none";

export function enumerar(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** "Falta el nombre del cliente, el vehículo y 2 más." Corto, para que la barra de abajo no crezca en el celular. */
export function textoFaltantes(falta: string[]): string {
  if (falta.length <= 3) return `Falta ${enumerar(falta)}.`;
  return `Falta ${falta.slice(0, 2).join(", ")} y ${falta.length - 2} más.`;
}

export function useMedia(consulta: string): boolean {
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

export function usePuedeCompartir(): boolean {
  return useSyncExternalStore(sinSuscripcion, puedeCompartirArchivos, () => false);
}

/**
 * Regenera el PDF mientras se edita y mantiene el anterior visible hasta que el nuevo termina de cargar.
 * `armar` en null significa que todavía no hay nada para mostrar.
 */
export function useVistaPrevia(armar: (() => Promise<File>) | null, activa: boolean) {
  const [capas, setCapas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const pedido = useRef(0);

  useEffect(() => {
    if (!activa || !armar) return;
    const numero = ++pedido.current;
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const archivo = await armar();
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
  }, [armar, activa]);

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

/** Ver, descargar o compartir el PDF. `textoCompartir` es el mensaje que acompaña al archivo en WhatsApp. */
export function useAccionesPDF(armar: () => Promise<File>, textoCompartir: () => string, lista: boolean) {
  const [accion, setAccion] = useState<Accion | null>(null);
  const [error, setError] = useState("");

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
      const archivo = await armar();
      if (tipo === "compartir") {
        await navigator.share({ files: [archivo], title: archivo.name, text: textoCompartir() });
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

  return { accion, error, limpiarError: () => setError(""), ejecutar };
}

export type Seccion = "auto" | "retiro";

/** Pantalla de dos columnas: carga a la izquierda y vista previa del PDF a la derecha (en escritorio). */
export function Pantalla({ children, barra, vistaPrevia }: { children: ReactNode; barra: ReactNode; vistaPrevia: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Encabezado />
      <main className="mx-auto grid w-full max-w-[1680px] flex-1 grid-cols-1 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col bg-white lg:border-r lg:border-linea">
          <div className="flex-1 space-y-10 px-4 pt-6 pb-10 sm:px-8 lg:overflow-y-auto">{children}</div>
          {barra}
        </section>
        {vistaPrevia}
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

const SECCIONES: { valor: Seccion; texto: string; ruta: string }[] = [
  { valor: "auto", texto: "Auto", ruta: "/" },
  { valor: "retiro", texto: "Retiro", ruta: "/retiro" },
];

/** Selector entre los cotizadores. Link ya le suma el prefijo de GitHub Pages. */
export function Secciones({ actual }: { actual: Seccion }) {
  return (
    <nav aria-label="Tipo de seguro" className="inline-flex rounded-full bg-fondo p-1">
      {SECCIONES.map((s) => (
        <Link
          key={s.valor}
          href={s.ruta}
          aria-current={s.valor === actual ? "page" : undefined}
          className="inline-flex h-8 items-center rounded-full px-4 text-[13px] font-semibold text-suave transition-colors duration-200 hover:text-tinta aria-[current=page]:bg-white aria-[current=page]:text-tinta aria-[current=page]:shadow-[0_1px_2px_rgba(35,26,29,0.08),0_4px_10px_-6px_rgba(35,26,29,0.25)]"
        >
          {s.texto}
        </Link>
      ))}
    </nav>
  );
}

export function BotonReiniciar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Empezar de nuevo"
      className="inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium text-suave transition-colors hover:bg-fondo hover:text-tinta sm:w-auto sm:px-3"
    >
      <RotateCcw size={14} aria-hidden />
      <span className="hidden sm:inline">Empezar de nuevo</span>
    </button>
  );
}

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-suave">{etiqueta}</span>
      {children}
      {ayuda}
    </label>
  );
}

export function BotonPrimario({
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

export function BotonSecundario({
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

type BarraAccionesProps = {
  estado: string;
  error: string;
  lista: boolean;
  accion: Accion | null;
  puedeCompartir: boolean;
  ejecutar: (tipo: Accion) => void;
};

/** Barra fija de abajo: qué falta, y los botones para ver, descargar o compartir. */
export function BarraAcciones({ estado, error, lista, accion, puedeCompartir, ejecutar }: BarraAccionesProps) {
  const apagado = !lista || !!accion;
  return (
    <div className="sticky bottom-0 z-10 border-t border-linea bg-white px-4 py-3 sm:px-8">
      <div className="flex items-center gap-3">
        <p
          aria-live="polite"
          className={`min-w-0 flex-1 text-[13px] leading-snug ${error ? "font-medium text-rojo" : "text-suave"}`}
        >
          {error || estado}
        </p>
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <BotonSecundario onClick={() => ejecutar("ver")} disabled={apagado} cargando={accion === "ver"}>
            <Eye size={16} aria-hidden />
            Ver
          </BotonSecundario>
          {puedeCompartir ? (
            <BotonPrimario onClick={() => ejecutar("compartir")} disabled={apagado} cargando={accion === "compartir"}>
              <Share2 size={16} aria-hidden />
              Compartir
            </BotonPrimario>
          ) : (
            <BotonPrimario onClick={() => ejecutar("descargar")} disabled={apagado} cargando={accion === "descargar"}>
              <Download size={16} aria-hidden />
              Descargar
            </BotonPrimario>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {puedeCompartir && (
            <BotonSecundario onClick={() => ejecutar("compartir")} disabled={apagado} cargando={accion === "compartir"}>
              <Share2 size={16} aria-hidden />
              Compartir
            </BotonSecundario>
          )}
          <BotonPrimario onClick={() => ejecutar("descargar")} disabled={apagado} cargando={accion === "descargar"}>
            <Download size={16} aria-hidden />
            Descargar PDF
          </BotonPrimario>
        </div>
      </div>
    </div>
  );
}

type PanelVistaPreviaProps = {
  vista: ReturnType<typeof useVistaPrevia>;
  /** Estado vacío a mostrar mientras no haya nada para armar; null cuando ya hay PDF. */
  vacio: ReactNode | null;
  titulo: string;
};

export function PanelVistaPrevia({ vista, vacio, titulo }: PanelVistaPreviaProps) {
  return (
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
        {vacio ??
          (vista.capas.length === 0 ? (
            <div className="grid h-full place-items-center text-[13px] text-suave">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={16} className="animate-spin" aria-hidden />
                Armando el PDF…
              </span>
            </div>
          ) : (
            vista.capas.map((url, i) => (
              <iframe
                key={url}
                src={`${url}#toolbar=0&navpanes=0&view=FitH`}
                title={titulo}
                onLoad={() => vista.alCargar(url)}
                className={`absolute inset-0 h-full w-full ${i === 0 ? "" : "pointer-events-none opacity-0"}`}
              />
            ))
          ))}
      </div>
    </aside>
  );
}

export function VistaVacia({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div className="max-w-[34ch]">
        <div aria-hidden className="mx-auto grid w-24 grid-cols-5 grid-rows-3">
          {["...cv", ".cvov", "cvocv"].flatMap((fila, i) =>
            fila.split("").map((c, j) => <span key={`${i}-${j}`} className={`aspect-square ${c === "." ? "" : COLOR_MOSAICO[c]}`} />),
          )}
        </div>
        <p className="mt-6 text-base font-semibold">{titulo}</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-suave">{texto}</p>
      </div>
    </div>
  );
}
