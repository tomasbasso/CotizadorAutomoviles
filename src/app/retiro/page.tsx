import type { Metadata } from "next";
import { CotizadorRetiro } from "@/components/CotizadorRetiro";

export const metadata: Metadata = {
  title: "Retiro · Cotizador · La Segunda Agencia Winifreda",
  description: "Proyecciones de Seguro de Retiro en PDF para los clientes de la agencia La Segunda en Winifreda.",
};

export default function Retiro() {
  return <CotizadorRetiro />;
}
