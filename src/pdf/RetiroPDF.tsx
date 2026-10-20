import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { AGENCIA } from "@/config/agencia";
import {
  type CotizacionRetiro,
  type Escenario,
  type EstadoEscenario,
  PARAMETROS_RETIRO,
  RELEVADO_RETIRO,
  RENDIMIENTO_CARTERA,
  SEXOS,
  TEXTOS_RETIRO,
  detalleGastos,
  estadoEscenario,
  estadoNacimiento,
  gastosSobreAporte,
  montoParaMostrar,
  textoMoneda,
  textoPlazo,
  textoPorcentaje,
  textoQuitas,
  textoTasa,
  textoTasaGarantizada,
} from "@/lib/retiro";
import { Cabecera, LINEA, Pie, ROJO, ROJO_CLARO, SOBRE_ROJO, SUAVE, estilosBase, registrarFuentes } from "./comun";

const s = StyleSheet.create({
  opciones: { flexDirection: "row", gap: 10 },
  tarjeta: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINEA,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 11,
  },
  tarjetaRecomendada: { backgroundColor: ROJO, borderColor: ROJO },
  tarjetaArriba: { flexDirection: "row", alignItems: "center", minHeight: 11 },
  cuerpoAncho: { flexDirection: "row", gap: 36 },
  eleccion: { flexDirection: "row", gap: 16 },
  etiqueta: { marginTop: 9, fontSize: 7.5, color: SUAVE },
  aporte: { marginTop: 1.5, fontSize: 13, fontWeight: 700, letterSpacing: -0.2 },
  renta: { marginTop: 1.5, fontWeight: 700, letterSpacing: -0.4 },
  detalleRenta: { fontSize: 7.5, color: SUAVE, marginTop: 1 },
  separador: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: LINEA },
  // Si el monto no entra al lado de la etiqueta, baja al renglón siguiente (alineado a la derecha).
  dato: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 5 },
  datoEtiqueta: { fontSize: 7.5, color: SUAVE, paddingRight: 6 },
  datoValor: { marginLeft: "auto", fontSize: 7.5, fontWeight: 600, textAlign: "right" },

  supuestos: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 0.5, borderTopColor: LINEA },
  supuesto: { width: "50%", paddingVertical: 5, paddingRight: 12, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  supuestoEtiqueta: { fontSize: 7.5, color: SUAVE },
  supuestoValor: { marginTop: 1.5, fontSize: 9, fontWeight: 600 },
  supuestoNota: { marginTop: 1.5, fontSize: 7.5, color: SUAVE, lineHeight: 1.35 },

  saber: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 0.5, borderTopColor: LINEA },
  saberItem: { width: "50%", paddingVertical: 6, paddingRight: 14, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  saberTitulo: { fontSize: 8.8, fontWeight: 600, lineHeight: 1.35, marginBottom: 1.5 },

  rendimientos: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: LINEA, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  periodo: { flex: 1, paddingVertical: 7 },
  periodoValor: { marginTop: 1.5, fontSize: 13, fontWeight: 700, letterSpacing: -0.2 },
  notaRendimiento: { marginTop: 6, fontSize: 7.5, color: SUAVE, lineHeight: 1.4 },

  glosario: { paddingVertical: 5, borderTopWidth: 0.5, borderTopColor: LINEA },
  glosarioNombre: { fontSize: 8.8, fontWeight: 600, lineHeight: 1.35, marginBottom: 1.5 },
  glosarioDetalle: { fontSize: 8, color: SUAVE, lineHeight: 1.4 },
});

type EscenarioArmado = Escenario & { numero: number; estado: Extract<EstadoEscenario, { tipo: "ok" }> };

/** Las cifras largas achican la letra para no salirse de la tarjeta. */
function tamanoRenta(texto: string, ancha: boolean): number {
  if (ancha || texto.length <= 12) return 18;
  return texto.length <= 15 ? 15 : 12.5;
}

function Tarjeta({ escenario, cotizacion, ancha }: { escenario: EscenarioArmado; cotizacion: CotizacionRetiro; ancha: boolean }) {
  const rojo = escenario.recomendada;
  const blanco = rojo ? { color: "#ffffff" } : {};
  const secundario = rojo ? { color: SOBRE_ROJO } : {};
  const { aporte, edadRetiro, resultado, totalAportado } = escenario.estado;
  const moneda = cotizacion.moneda;
  const renta = montoParaMostrar(resultado.rentaMensual, moneda);

  // Lo que eligió el cliente (cuánto y hasta cuándo), lado a lado.
  const eleccion = (
    <View style={s.eleccion}>
      <View>
        <Text style={[s.etiqueta, secundario]}>Ahorrás por mes</Text>
        <Text style={[s.aporte, blanco]}>{montoParaMostrar(aporte, moneda)}</Text>
      </View>
      <View>
        <Text style={[s.etiqueta, secundario]}>Te retirás a los</Text>
        <Text style={[s.aporte, blanco]}>{edadRetiro} años</Text>
      </View>
    </View>
  );
  const rentaEstimada = (
    <View>
      <Text style={[s.etiqueta, secundario]}>Renta mensual estimada</Text>
      <Text style={[s.renta, { fontSize: tamanoRenta(renta, ancha) }, blanco]}>{renta}</Text>
      <Text style={[s.detalleRenta, secundario]}>de por vida, desde los {edadRetiro} años</Text>
    </View>
  );
  const datos = [
    ["Fondos acumulados", montoParaMostrar(resultado.fondosAcumulados, moneda)],
    ["Tiempo de ahorro", textoPlazo(resultado.mesesDeAporte)],
    ["Total aportado", montoParaMostrar(totalAportado, moneda)],
  ];

  return (
    <View style={[s.tarjeta, rojo ? s.tarjetaRecomendada : {}]} wrap={false}>
      <View style={s.tarjetaArriba}>
        {rojo ? (
          <Text style={[estilosBase.chip, estilosBase.chipSobreRojo]}>RECOMENDADA</Text>
        ) : (
          <Text style={estilosBase.marcaOpcion}>OPCIÓN {escenario.numero}</Text>
        )}
      </View>
      {ancha ? (
        <View style={s.cuerpoAncho}>
          {eleccion}
          {rentaEstimada}
        </View>
      ) : (
        <>
          {eleccion}
          {rentaEstimada}
        </>
      )}
      <View style={[s.separador, rojo ? { borderTopColor: ROJO_CLARO } : {}]} />
      <View style={ancha ? { flexDirection: "row", gap: 18 } : {}}>
        {datos.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={[s.dato, ancha ? { flexDirection: "column", flexWrap: "nowrap", justifyContent: "flex-start" } : {}]}>
            <Text style={[s.datoEtiqueta, secundario]}>{etiqueta}</Text>
            <Text style={[s.datoValor, ancha ? { marginLeft: 0, textAlign: "left", marginTop: 1.5, fontSize: 9 } : {}, blanco]}>
              {valor}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function RetiroPDF({ cotizacion, base }: { cotizacion: CotizacionRetiro; base: string }) {
  registrarFuentes(base);
  const hoy = cotizacion.fecha;
  const escenarios: EscenarioArmado[] = cotizacion.escenarios.flatMap((e, i) => {
    const estado = estadoEscenario(cotizacion, e, hoy);
    return estado.tipo === "ok" ? [{ ...e, numero: i + 1, estado }] : [];
  });
  const cliente = cotizacion.cliente.trim() || "tu cliente";
  const nacimiento = estadoNacimiento(cotizacion.nacimiento, hoy);
  const edad = nacimiento.tipo === "ok" ? `${nacimiento.edad} años` : "";
  const sexo = SEXOS.find((x) => x.valor === cotizacion.sexo)?.texto ?? "";
  const moneda = cotizacion.moneda === "ARS" ? "Pesos" : "Dólares";
  const relevado = new Date(`${RELEVADO_RETIRO}T12:00:00`).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const rendimiento = RENDIMIENTO_CARTERA[cotizacion.moneda];
  const supuestos: [string, string, string?][] = [
    ["Plan", "Futuro Protegido"],
    ["Moneda", moneda, cotizacion.moneda === "USD" ? TEXTOS_RETIRO.dolares : undefined],
    ["Fecha de nacimiento", [cotizacion.nacimiento, edad && `(${edad})`].filter(Boolean).join(" ")],
    ["Sexo que figura en el DNI", sexo],
    [
      "Tasa de proyección",
      `${textoTasa(cotizacion.moneda)} anual ${textoMoneda(cotizacion.moneda)}`,
      `Mínimo garantizado: ${textoTasaGarantizada(cotizacion.moneda)}.`,
    ],
    [
      "Gastos sobre cada aporte",
      textoPorcentaje(gastosSobreAporte(cotizacion.moneda)),
      `${detalleGastos(cotizacion.moneda).charAt(0).toUpperCase()}${detalleGastos(cotizacion.moneda).slice(1)}.`,
    ],
  ];
  const periodos: [string, number][] = [
    ["Último mes", rendimiento.ultimoMes],
    ["3 meses", rendimiento.ultimos3Meses],
    ["6 meses", rendimiento.ultimos6Meses],
    ["12 meses", rendimiento.ultimos12Meses],
    ["24 meses", rendimiento.ultimos24Meses],
  ];
  const { retencionGanancias, baseNoImponible } = PARAMETROS_RETIRO.rescates;
  const saber = [
    [
      "Podés sacar la plata cuando quieras",
      `Todo o una parte. Según el plan puede haber un plazo mínimo de hasta ${PARAMETROS_RETIRO.rescates.plazoMinimoMaximoMeses} meses. Hay una quita que baja con los años (${textoQuitas()}) y una retención de Ganancias del ${textoPorcentaje(retencionGanancias)} sobre lo que supere ${montoParaMostrar(baseNoImponible, "ARS")}.`,
    ],
    [
      "Al retirarte, elegís cómo cobrar",
      "Todo junto, una parte en efectivo y el resto como renta, o todo como renta mensual: vitalicia, garantizada por un plazo, temporaria o extensiva a un sucesor. Una vez elegida la renta, el resto del fondo ya no se puede retirar.",
    ],
    [
      "Si fallecés antes de retirarte",
      "Tus beneficiarios cobran todo lo acumulado más lo que rindió, sin quita ni retención de Ganancias.",
    ],
    [
      "Si dejás de aportar, no perdés nada",
      "No genera deuda y lo ahorrado sigue rindiendo. También podés cambiar el monto del aporte o hacer aportes extra.",
    ],
    [
      "Beneficios impositivos",
      "Los aportes se deducen de Ganancias hasta el tope legal, el seguro está exento de Bienes Personales y los fondos son inembargables.",
    ],
    ["Seguís tu ahorro online", "Ves tu estado de cuenta en la web o en la app de La Segunda."],
  ];
  const glosario = [
    ["Renta mensual estimada", TEXTOS_RETIRO.rentaMensual],
    ["Fondos acumulados", TEXTOS_RETIRO.fondosAcumulados],
    ["Total aportado", "La suma de todos los aportes mensuales desde hoy hasta la edad de retiro."],
  ];

  return (
    <Document
      title={`Proyección de retiro para ${cliente}`}
      author={`${AGENCIA.nombre} · La Segunda Seguros`}
      subject={`Seguro de Retiro · ahorro ${textoMoneda(cotizacion.moneda)}`}
      language="es-AR"
    >
      <Page size="A4" style={estilosBase.pagina}>
        <Cabecera
          base={base}
          titulo={`Proyección de retiro para ${cliente}`}
          subtitulo={`Seguro de Retiro · Ahorro ${textoMoneda(cotizacion.moneda)}${edad ? ` · ${edad}` : ""}`}
          fecha={cotizacion.fecha}
          numero={cotizacion.numero}
        />

        {escenarios.length > 0 && (
          <>
            <View style={estilosBase.seccion}>
              <View style={s.opciones}>
                {escenarios.map((e) => (
                  <Tarjeta key={e.id} escenario={e} cotizacion={cotizacion} ancha={escenarios.length === 1} />
                ))}
              </View>
            </View>

            <View style={[estilosBase.seccion, { marginTop: 18 }]} wrap={false}>
              <Text style={estilosBase.h2}>Con qué datos se calculó</Text>
              <View style={s.supuestos}>
                {supuestos.map(([etiqueta, valor, nota]) => (
                  <View key={etiqueta} style={s.supuesto}>
                    <Text style={s.supuestoEtiqueta}>{etiqueta}</Text>
                    <Text style={s.supuestoValor}>{valor}</Text>
                    {nota ? <Text style={s.supuestoNota}>{nota}</Text> : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={[estilosBase.seccion, { marginTop: 18 }]} wrap={false}>
              <Text style={estilosBase.h2}>Qué significa cada número</Text>
              {glosario.map(([nombre, detalle]) => (
                <View key={nombre} style={s.glosario}>
                  <Text style={s.glosarioNombre}>{nombre}</Text>
                  <Text style={s.glosarioDetalle}>{detalle}</Text>
                </View>
              ))}
            </View>

            <View break>
              <View wrap={false}>
                <Text style={estilosBase.h2}>Lo que tenés que saber</Text>
                <View style={s.saber}>
                  {saber.map(([titulo, detalle]) => (
                    <View key={titulo} style={s.saberItem}>
                      <Text style={s.saberTitulo}>{titulo}</Text>
                      <Text style={s.glosarioDetalle}>{detalle}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[estilosBase.seccion, { marginTop: 22 }]} wrap={false}>
                <Text style={estilosBase.h2}>Cómo rindió la cartera {textoMoneda(cotizacion.moneda)}</Text>
                <View style={s.rendimientos}>
                  {periodos.map(([periodo, valor]) => (
                    <View key={periodo} style={s.periodo}>
                      <Text style={s.supuestoEtiqueta}>{periodo}</Text>
                      <Text style={s.periodoValor}>{textoPorcentaje(valor, true)}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.notaRendimiento}>
                  Rendimiento total de la cartera de inversiones de La Segunda Retiro según el informe mensual de{" "}
                  {RENDIMIENTO_CARTERA.informe}. El de cada póliza puede ser distinto, según sus condiciones. Lo que rindió
                  la cartera en el pasado no asegura lo que va a rendir. La proyección de la hoja 1 usa la tasa de{" "}
                  {textoTasa(cotizacion.moneda)} anual del cotizador de La Segunda.
                </Text>
              </View>

              <Text style={[estilosBase.aviso, { marginTop: 22 }]}>
                Proyección informativa preparada por {AGENCIA.nombre} con el cálculo del cotizador online de La
                Segunda Seguros y las condiciones del plan Futuro Protegido a {relevado}. Las condiciones definitivas
                se confirman al emitir la póliza y se rigen por sus condiciones generales y particulares.
              </Text>
            </View>
          </>
        )}

        <Pie base={base} />
      </Page>
    </Document>
  );
}
