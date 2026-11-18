import type { Metadata } from "next";
import { CotizadorRamo } from "@/components/CotizadorRamo";

export const metadata: Metadata = {
  title: "Vida · Cotizador · La Segunda Agencia Winifreda",
  description: "Cotizaciones de seguro de vida individual en PDF para los clientes de la agencia La Segunda en Winifreda.",
};

export default function Vida() {
  return <CotizadorRamo ramo="vida" />;
}
