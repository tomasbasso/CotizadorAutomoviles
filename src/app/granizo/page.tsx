import type { Metadata } from "next";
import { CotizadorGranizo } from "@/components/CotizadorGranizo";

export const metadata: Metadata = {
  title: "Granizo · Cotizador · La Segunda Agencia Winifreda",
  description: "Cotizaciones de seguro de granizo para Cosecha Gruesa 2026/27 en PDF para los clientes de la agencia La Segunda en Winifreda.",
};

export default function Granizo() {
  return <CotizadorGranizo />;
}
