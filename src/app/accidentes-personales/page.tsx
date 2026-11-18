import type { Metadata } from "next";
import { CotizadorRamo } from "@/components/CotizadorRamo";

export const metadata: Metadata = {
  title: "Accidentes personales · Cotizador · La Segunda Agencia Winifreda",
  description: "Cotizaciones de seguro de accidentes personales en PDF para los clientes de la agencia La Segunda en Winifreda.",
};

export default function AccidentesPersonales() {
  return <CotizadorRamo ramo="ap" />;
}
