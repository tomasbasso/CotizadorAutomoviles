import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cotizador · La Segunda Agencia Winifreda",
  description: "Cotizaciones de seguro de auto en PDF para los clientes de la agencia La Segunda en Winifreda.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#e20039",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
