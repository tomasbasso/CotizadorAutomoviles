import { pdf } from "@react-pdf/renderer";
import type { Cotizacion } from "@/lib/cotizacion";
import { BASE_PATH } from "@/lib/rutas";
import { CotizacionPDF } from "./CotizacionPDF";

/** Arma el PDF en el navegador. Se importa de forma diferida para que react-pdf no entre al render del servidor. */
export function generarPDF(cotizacion: Cotizacion): Promise<Blob> {
  return pdf(<CotizacionPDF cotizacion={cotizacion} base={`${window.location.origin}${BASE_PATH}`} />).toBlob();
}
