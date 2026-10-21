import type { Metadata } from "next";
import { CotizadorRetiro } from "@/components/CotizadorRetiro";

const titulo = "Simulá tu Seguro de Retiro · La Segunda Agencia Winifreda";
const descripcion = "Elegí cuánto ahorrar por mes y a qué edad retirarte, y mirá cuánto podrías juntar. No se guarda nada de lo que cargás.";

export const metadata: Metadata = {
  title: titulo,
  description: descripcion,
  // Lo que muestra WhatsApp al pegar el link.
  openGraph: { title: "¿Cuánto podés juntar para tu retiro?", description: descripcion, locale: "es_AR", type: "website" },
};

export default function SimuladorRetiro() {
  return <CotizadorRetiro modo="cliente" />;
}
