import type { Metadata } from "next";
import { CotizadorRamo } from "@/components/CotizadorRamo";

export const metadata: Metadata = {
  title: "Comercio · Cotizador · La Segunda Agencia Winifreda",
  description: "Cotizaciones de seguro integral de comercio en PDF para los clientes de la agencia La Segunda en Winifreda.",
};

export default function Comercio() {
  return <CotizadorRamo ramo="comercio" />;
}
