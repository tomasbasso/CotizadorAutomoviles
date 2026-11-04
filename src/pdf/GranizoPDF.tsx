import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { AGENCIA } from "@/config/agencia";
import { fechaLarga } from "@/lib/cotizacion";
import {
  type CotizacionGranizo,
  calcularGranizo,
  fechaCorta,
  leerNumero,
  monto,
  porcentaje,
  textoCultivo,
  textoFranquiciaGranizo,
  textoPago,
  textoPlan,
  textoResiembra,
} from "@/lib/granizo";
import { Cabecera, LINEA, Pie, ROJO, SOBRE_ROJO, SUAVE, estilosBase, registrarFuentes } from "./comun";

const s = StyleSheet.create({
  tarjeta: { backgroundColor: ROJO, borderRadius: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  tarjetaFila: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  etiquetaRoja: { fontSize: 7.5, color: SOBRE_ROJO },
  premio: { marginTop: 2, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: "#ffffff" },
  detallePremio: { marginTop: 2, fontSize: 8, color: SOBRE_ROJO },
  cifras: { flexDirection: "row", gap: 22 },
  cifra: { alignItems: "flex-end" },
  cifraValor: { marginTop: 2, fontSize: 11, fontWeight: 700, color: "#ffffff" },

  grilla: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 0.5, borderTopColor: LINEA },
  celda: { width: "33.33%", paddingVertical: 4, paddingRight: 12, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  celdaEtiqueta: { fontSize: 7.5, color: SUAVE },
  celdaValor: { marginTop: 1.5, fontSize: 9, fontWeight: 600 },

  fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  filaTexto: { fontSize: 8, color: SUAVE, paddingRight: 10, flex: 1 },
  filaValor: { fontSize: 8, fontWeight: 600 },
  filaTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, marginTop: 1, borderTopWidth: 1, borderTopColor: "#231a1d" },
  filaTotalTexto: { fontSize: 9.5, fontWeight: 700 },

  incluye: { flexDirection: "row", flexWrap: "wrap" },
  incluyeItem: { width: "50%", paddingVertical: 3.5, paddingRight: 14, borderTopWidth: 0.5, borderTopColor: LINEA },
  incluyeTitulo: { fontSize: 8.8, fontWeight: 600, lineHeight: 1.35, marginBottom: 1.5 },
  incluyeDetalle: { fontSize: 8, color: SUAVE, lineHeight: 1.4 },
});

export function GranizoPDF({ cotizacion: c, base }: { cotizacion: CotizacionGranizo; base: string }) {
  registrarFuentes(base);
  const estado = calcularGranizo(c, c.fecha);
  const cliente = c.cliente.trim();
  const titulo = `Seguro de granizo para ${cliente || "el cliente"}`;
  const cultivo = estado.tipo === "ok" && estado.maizTardio ? "Maíz tardío" : textoCultivo(c.cultivo);
  const ha = leerNumero(c.hectareas);
  const u = c.moneda;

  const datos: [string, string][] =
    estado.tipo === "ok"
      ? [
          ["Lote", `${estado.fila.depto}, ${estado.fila.provincia}`],
          ["Cultivo", `${cultivo}${c.siembra ? ` · siembra ${c.siembra}` : ""}`],
          ["Cobertura", `${textoPlan(c.plan)}${c.planchado ? " + Planchado de suelos" : ""}`],
          ["Franquicia", textoFranquiciaGranizo(c)],
          ["Resiembra", textoResiembra(c.resiembra)],
          ["Superficie", `${ha.toLocaleString("es-AR")} ha · ${monto(estado.porHa, u)} por ha`],
          ["Suma asegurada", monto(estado.sumaAsegurada, u)],
          ["Forma de pago", textoPago(c.pago)],
          ["Cubre granizo e incendio desde", fechaCorta(estado.inicio)],
          ...(estado.inicioViento ? ([[c.plan === "h" ? "Cubre viento y helada desde" : "Cubre viento desde", fechaCorta(estado.inicioViento)]] as [string, string][]) : []),
          ["Vence", estado.fin ? `${fechaCorta(estado.fin)} (${estado.notaFin})` : "Según la fecha de siembra"],
        ]
      : [];

  const incluye = [
    ["Granizo", "Daños por granizo en el cultivo asegurado durante la vigencia, sobre la suma asegurada por hectárea."],
    ["Incendio de cultivo y de rastrojo", "Incluido en la cobertura, sin costo adicional."],
    ["Resiembra", `Opción ${textoResiembra(c.resiembra)}: si el granizo obliga a resembrar, se indemniza según esa modalidad.`],
    ...(c.plan === "v" ? [["Viento", "Daños por viento con franquicia del 20% deducible sobre el lote. Empieza a cubrir a los 7 días."]] : []),
    ...(c.plan === "h"
      ? [["Viento y helada", "Viento hasta la cosecha y heladas del 01/10 al 31/03, con franquicia del 20% deducible sobre el lote. Empiezan a cubrir a los 7 días."]]
      : []),
    ...(c.pago === "2080" || c.pago === "100"
      ? [["Pago a cosecha", `El saldo se paga al fin de la vigencia${estado.tipo === "ok" && estado.fin ? `, el ${fechaLarga(estado.fin)}` : ""}.`]]
      : []),
    ...(u === "qq" ? [["Póliza en quintales", "El valor se ajusta por la pizarra de Rosario entre el inicio de la vigencia y el día 10 del mes de vencimiento."]] : []),
  ];

  return (
    <Document title={titulo} author={`${AGENCIA.nombre} · La Segunda Seguros`} subject="Seguro de granizo · Cosecha Gruesa 2026/27" language="es-AR">
      <Page size="A4" style={estilosBase.pagina}>
        <Cabecera
          base={base}
          titulo={titulo}
          subtitulo={`Cosecha Gruesa 2026/27 · ${cultivo}${estado.tipo === "ok" ? ` · ${estado.fila.depto}` : ""}`}
          fecha={c.fecha}
          numero={c.numero}
        />

        {estado.tipo === "ok" && (
          <>
            <View style={[estilosBase.seccion, { marginTop: 16 }]} wrap={false}>
              <View style={s.tarjeta}>
                <Text style={[estilosBase.chip, estilosBase.chipSobreRojo, { alignSelf: "flex-start" }]}>
                  {textoPlan(c.plan).toUpperCase()}
                </Text>
                <View style={[s.tarjetaFila, { marginTop: 8 }]}>
                  <View>
                    <Text style={s.etiquetaRoja}>Costo total del seguro</Text>
                    <Text style={s.premio}>{monto(estado.premio, u)}</Text>
                    <Text style={s.detallePremio}>con impuestos y recargo financiero · {textoPago(c.pago).toLowerCase()}</Text>
                  </View>
                  <View style={s.cifras}>
                    <View style={s.cifra}>
                      <Text style={s.etiquetaRoja}>Por hectárea</Text>
                      <Text style={s.cifraValor}>{monto(estado.premio / (ha || 1), u)}</Text>
                    </View>
                    <View style={s.cifra}>
                      <Text style={s.etiquetaRoja}>Sobre la suma</Text>
                      <Text style={s.cifraValor}>
                        {estado.sumaAsegurada ? porcentaje((estado.premio / estado.sumaAsegurada) * 100) : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={[estilosBase.seccion, { marginTop: 14 }]} wrap={false}>
              <Text style={estilosBase.h2}>Qué se asegura</Text>
              <View style={s.grilla}>
                {datos.map(([etiqueta, valor]) => (
                  <View key={etiqueta} style={s.celda}>
                    <Text style={s.celdaEtiqueta}>{etiqueta}</Text>
                    <Text style={s.celdaValor}>{valor}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[estilosBase.seccion, { marginTop: 14 }]} wrap={false}>
              <Text style={estilosBase.h2}>Cómo se llega al costo</Text>
              <View style={s.fila}>
                <Text style={s.filaTexto}>Suma asegurada</Text>
                <Text style={s.filaValor}>{monto(estado.sumaAsegurada, u)}</Text>
              </View>
              {/* Los descuentos no se muestran al cliente: la tasa ya los trae aplicados. */}
              <View style={s.fila}>
                <Text style={s.filaTexto}>Tasa aplicada</Text>
                <Text style={s.filaValor}>{porcentaje(estado.tasaFinal, 3)}</Text>
              </View>
              <View style={s.fila}>
                <Text style={s.filaTexto}>Prima</Text>
                <Text style={s.filaValor}>{monto(estado.prima, u)}</Text>
              </View>
              {estado.recargo != null && (
                <View style={s.fila}>
                  <Text style={s.filaTexto}>Impuestos y recargo financiero</Text>
                  <Text style={s.filaValor}>+ {porcentaje(estado.recargo)}</Text>
                </View>
              )}
              <View style={s.filaTotal}>
                <Text style={s.filaTotalTexto}>Costo total</Text>
                <Text style={s.filaTotalTexto}>{monto(estado.premio, u)}</Text>
              </View>
              {u === "qq" && leerNumero(c.precioQq) > 0 && (
                <Text style={[s.filaTexto, { marginTop: 4, textAlign: "right" }]}>
                  Equivale a {monto(estado.premio * leerNumero(c.precioQq), "ars")} con el quintal a {monto(leerNumero(c.precioQq), "ars")}.
                </Text>
              )}
            </View>

            <View style={[estilosBase.seccion, { marginTop: 14 }]} wrap={false}>
              <Text style={estilosBase.h2}>Lo que incluye</Text>
              <View style={s.incluye}>
                {incluye.map(([nombre, detalle]) => (
                  <View key={nombre} style={s.incluyeItem}>
                    <Text style={s.incluyeTitulo}>{nombre}</Text>
                    <Text style={s.incluyeDetalle}>{detalle}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[estilosBase.aviso, { marginTop: 12 }]}>
              Cotización orientativa preparada por {AGENCIA.nombre} con las tarifas de la circular 02/2026 de La Segunda
              Seguros para Cosecha Gruesa 2026/27. El valor definitivo es el que emite la compañía y la cobertura se rige
              por las condiciones generales y particulares de la póliza.
            </Text>
          </>
        )}

        <Pie base={base} />
      </Page>
    </Document>
  );
}
