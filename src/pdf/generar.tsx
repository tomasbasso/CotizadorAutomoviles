import { pdf } from "@react-pdf/renderer";
import type { Cotizacion } from "@/lib/cotizacion";
import type { CotizacionRetiro } from "@/lib/retiro";
import { BASE_PATH } from "@/lib/rutas";
import { CotizacionPDF } from "./CotizacionPDF";
import { RetiroPDF } from "./RetiroPDF";

const base = () => `${window.location.origin}${BASE_PATH}`;

/** Arma el PDF en el navegador. Se importa de forma diferida para que react-pdf no entre al render del servidor. */
export function generarPDF(cotizacion: Cotizacion): Promise<Blob> {
  return pdf(<CotizacionPDF cotizacion={cotizacion} base={base()} />).toBlob();
}

export function generarPDFRetiro(cotizacion: CotizacionRetiro): Promise<Blob> {
  return pdf(<RetiroPDF cotizacion={cotizacion} base={base()} />).toBlob();
}
