import type { Metadata } from "next";
import { CotizadorRamo } from "@/components/CotizadorRamo";

export const metadata: Metadata = {
  title: "Hogar · Cotizador · La Segunda Agencia Winifreda",
  description: "Cotizaciones de seguro de hogar en PDF para los clientes de la agencia La Segunda en Winifreda.",
};

export default function Hogar() {
  return <CotizadorRamo ramo="hogar" />;
}
