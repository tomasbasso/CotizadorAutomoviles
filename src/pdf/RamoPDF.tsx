import { Circle, Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ComponentProps, ReactNode } from "react";
import { AGENCIA } from "@/config/agencia";
import {
  type CotizacionRamo,
  type FilaRamo,
  type OpcionRamo,
  type PlanRamo,
  RAMOS,
  type Ramo,
  celdaRamo,
  filasDe,
  glosarioRamo,
  lleva,
  montoRamo,
  numeroDe,
  planDe,
  plazoDe,
  subtituloRamo,
  textoPeriodoRamo,
} from "@/lib/ramos";
import { Cabecera, LINEA, Pie, ROJO, ROSA, SOBRE_ROJO, SUAVE, TINTA, estilosBase, registrarFuentes } from "./comun";

const s = StyleSheet.create({
  opciones: { flexDirection: "row", gap: 10 },
  tarjeta: { flex: 1, borderWidth: 1, borderColor: LINEA, borderRadius: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 11 },
  tarjetaRecomendada: { backgroundColor: ROJO, borderColor: ROJO },
  tarjetaArriba: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nombrePlan: { marginTop: 7, fontSize: 12, fontWeight: 700, letterSpacing: -0.2 },
  tipoPlan: { marginTop: 1.5, fontSize: 8, color: SUAVE },
  precio: { marginTop: 9, fontSize: 18, fontWeight: 700, letterSpacing: -0.4 },
  periodo: { fontSize: 7.5, color: SUAVE, marginTop: 1 },
  dato: { marginTop: 8, fontSize: 7.5, lineHeight: 1.35 },
  datoValor: { fontWeight: 700 },

  tablaCabecera: { flexDirection: "row", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: TINTA },
  celdaEtiqueta: { flex: 1, paddingVertical: 4, paddingRight: 8 },
  celdaOpcion: { alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  cabeceraPlan: { fontSize: 8, fontWeight: 700, textAlign: "center", lineHeight: 1.25 },
  cabeceraOpcion: { fontSize: 6.5, color: SUAVE, textAlign: "center", marginTop: 1, marginBottom: 4 },
  grupo: { fontSize: 6.5, fontWeight: 700, color: ROJO, letterSpacing: 0.9, textTransform: "uppercase" },
  filaGrupo: { flexDirection: "row" },
  fila: { flexDirection: "row", minHeight: 12.4, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  etiqueta: { fontSize: 8.3 },
  nota: { fontSize: 7, fontWeight: 700, color: ROJO, textAlign: "center" },
  noIncluye: { fontSize: 7, fontWeight: 600, color: SUAVE },
  sinCobertura: { width: 7, height: 1.2, backgroundColor: "#cfc4c8" },

  glosarioColumnas: { flexDirection: "row", gap: 22 },
  glosarioColumna: { flex: 1 },
  glosario: { paddingVertical: 4.5, borderTopWidth: 0.5, borderTopColor: LINEA },
  glosarioNombre: { fontSize: 8.8, fontWeight: 600, lineHeight: 1.35, marginBottom: 1.5 },
  glosarioDetalle: { fontSize: 8, color: SUAVE, lineHeight: 1.4 },
  glosarioPlan: { fontSize: 7.5, fontWeight: 600, color: TINTA, marginTop: 2 },
  intro: { fontSize: 9, color: SUAVE, lineHeight: 1.45, marginBottom: 10, maxWidth: 420 },

  planes: { flexDirection: "row", gap: 14 },
  plan: { flex: 1, borderTopWidth: 1.5, borderTopColor: ROJO, paddingTop: 6 },
  planNombre: { fontSize: 10, fontWeight: 700 },
  planTitular: { marginTop: 1.5, fontSize: 8, fontWeight: 600, color: ROJO },
  planIntro: { marginTop: 4, fontSize: 8, color: SUAVE, lineHeight: 1.4 },
  vineta: { marginTop: 3.5, fontSize: 8, color: SUAVE, lineHeight: 1.4 },
  vinetaTitulo: { fontWeight: 600, color: TINTA },
});

function Tilde() {
  return (
    <Svg width={9} height={9} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={5} fill={ROJO} />
      <Path d="M2.9 5.2 L4.4 6.6 L7.2 3.7" stroke="#ffffff" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

type OpcionArmada = OpcionRamo & { datos: PlanRamo; numero: number };

function Tarjeta({ ramo, opcion, c }: { ramo: Ramo; opcion: OpcionArmada; c: CotizacionRamo }) {
  const rojo = opcion.recomendada;
  const blanco = rojo ? { color: "#ffffff" } : {};
  const secundario = rojo ? { color: SOBRE_ROJO } : {};
  const plazo = plazoDe(ramo, opcion);
  const destacadas = filasDe(ramo).filter((f) => f.destacada && lleva(f, opcion.datos, opcion) && numeroDe(opcion.sumas[f.id]) > 0);
  return (
    <View style={[s.tarjeta, rojo ? s.tarjetaRecomendada : {}]} wrap={false}>
      <View style={s.tarjetaArriba}>
        <Text style={[estilosBase.chip, rojo ? estilosBase.chipSobreRojo : {}]}>{ramo.nombre.toUpperCase()}</Text>
        <Text style={[estilosBase.marcaOpcion, blanco]}>{rojo ? "RECOMENDADA" : `OPCIÓN ${opcion.numero}`}</Text>
      </View>
      <Text style={[s.nombrePlan, blanco]}>{opcion.datos.nombre}</Text>
      <Text style={[s.tipoPlan, secundario]}>{opcion.datos.tipo}</Text>
      <Text style={[s.precio, blanco]}>{numeroDe(opcion.precio) > 0 ? montoRamo(opcion.precio, c.moneda) : `${c.moneda === "usd" ? "US$" : "$"} —`}</Text>
      <Text style={[s.periodo, secundario]}>{textoPeriodoRamo(c.periodo)}</Text>
      {destacadas.map((f) => (
        <Text key={f.id} style={[s.dato, blanco]}>
          {f.nombre}: <Text style={s.datoValor}>{montoRamo(opcion.sumas[f.id], c.moneda)}</Text>
        </Text>
      ))}
      {plazo ? (
        <Text style={[s.dato, destacadas.length ? { marginTop: 2 } : {}, blanco]}>
          {ramo.cotizacion.plazo?.etiqueta}: <Text style={s.datoValor}>{plazo}</Text>
        </Text>
      ) : null}
    </View>
  );
}

type Columna = (o: OpcionArmada) => ComponentProps<typeof View>["style"];

function Tabla({ ramo, opciones, c }: { ramo: Ramo; opciones: OpcionArmada[]; c: CotizacionRamo }) {
  const ancho = opciones.length === 1 ? 120 : opciones.length === 2 ? 104 : 92;
  const columna: Columna = (o) => [s.celdaOpcion, { width: ancho }, o.recomendada ? { backgroundColor: ROSA } : {}];
  // Solo las filas que lleva alguna opción: lo que ningún plan elegido tiene no suma nada a la comparación.
  const grupos = ramo.grupos
    .map((g) => ({ ...g, filas: g.filas.filter((f) => opciones.some((o) => lleva(f, o.datos, o))) }))
    .filter((g) => g.filas.length > 0);
  const etiquetaOpcion = (o: OpcionArmada) => {
    const mismoPlan = opciones.filter((x) => x.plan === o.plan).length > 1;
    return mismoPlan || ramo.planes.length === 1 ? `Opción ${o.numero}` : o.datos.nombre;
  };

  return (
    <View>
      <View style={s.tablaCabecera} wrap={false}>
        <View style={s.celdaEtiqueta} />
        {opciones.map((o) => (
          <View key={o.id} style={columna(o)}>
            <Text style={[s.cabeceraPlan, o.recomendada ? { color: ROJO } : {}]}>{etiquetaOpcion(o)}</Text>
            <Text style={s.cabeceraOpcion}>{etiquetaOpcion(o).startsWith("Opción") ? o.datos.nombre : `Opción ${o.numero}`}</Text>
          </View>
        ))}
      </View>
      {grupos.map((g) => {
        const [primera, ...resto] = g.filas;
        return (
          <View key={g.nombre}>
            {/* El título del grupo nunca queda solo al pie de la hoja: baja con su primera fila. */}
            <View wrap={false}>
              <View style={s.filaGrupo}>
                <Text style={[s.grupo, s.celdaEtiqueta, { paddingTop: 4.5, paddingBottom: 2 }]}>{g.nombre}</Text>
                {opciones.map((o) => (
                  <View key={o.id} style={columna(o)} />
                ))}
              </View>
              <FilaTabla fila={primera} opciones={opciones} columna={columna} c={c} />
            </View>
            {resto.map((f) => (
              <FilaTabla key={f.id} fila={f} opciones={opciones} columna={columna} c={c} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function FilaTabla({ fila, opciones, columna, c }: { fila: FilaRamo; opciones: OpcionArmada[]; columna: Columna; c: CotizacionRamo }) {
  return (
    <View style={s.fila} wrap={false}>
      <View style={[s.celdaEtiqueta, { justifyContent: "center" }]}>
        <Text style={s.etiqueta}>{fila.nombre}</Text>
      </View>
      {opciones.map((o) => {
        const celda = celdaRamo(fila, o.datos, o, c.moneda);
        return (
          <View key={o.id} style={columna(o)}>
            {celda.tipo === "si" && <Tilde />}
            {celda.tipo === "nota" && (
              <Text style={s.nota}>
                {celda.texto}
                {fila.unidad && numeroDe(o.sumas[fila.id]) > 0 ? ` ${fila.unidad}` : ""}
              </Text>
            )}
            {celda.tipo === "no-incluye" && <Text style={s.noIncluye}>No incluye</Text>}
            {celda.tipo === "no" && <View style={s.sinCobertura} />}
          </View>
        );
      })}
    </View>
  );
}

type Entrada = { id: string; nombre: string; variantes: { texto: string; planes: string[] }[] };

const sinPunto = (t: string) => t.trim().replace(/\.$/, "").toLowerCase();

function EntradaGlosario({ e }: { e: Entrada }) {
  // Si el texto oficial solo repite el nombre, alcanza con el nombre.
  const variantes = e.variantes.filter((v) => sinPunto(v.texto) !== sinPunto(e.nombre));
  return (
    <View style={s.glosario} wrap={false}>
      <Text style={[s.glosarioNombre, variantes.length ? {} : { marginBottom: 0 }]}>{e.nombre}</Text>
      {variantes.map((v) => (
        <View key={v.texto}>
          {v.planes.length > 0 && <Text style={s.glosarioPlan}>{v.planes.join(" y ")}</Text>}
          <Text style={s.glosarioDetalle}>{v.texto}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * De a dos por renglón. A diferencia de las dos columnas del PDF de auto (que siempre arranca en hoja nueva),
 * acá el glosario puede caer a mitad de hoja: los renglones cortan limpio entre hojas y las columnas no.
 */
function Glosario({ entradas, titulo }: { entradas: Entrada[]; titulo: ReactNode }) {
  const pares: Entrada[][] = [];
  for (let i = 0; i < entradas.length; i += 2) pares.push(entradas.slice(i, i + 2));
  const renglon = (par: Entrada[]) => (
    <View key={par[0].id} style={s.glosarioColumnas} wrap={false}>
      {[0, 1].map((j) => (
        <View key={j} style={s.glosarioColumna}>
          {par[j] ? <EntradaGlosario e={par[j]} /> : null}
        </View>
      ))}
    </View>
  );
  const [primero, ...resto] = pares;
  return (
    <View>
      {/* El título nunca queda solo al pie de la hoja: baja con el primer renglón. */}
      <View wrap={false}>
        {titulo}
        {primero && renglon(primero)}
      </View>
      {resto.map(renglon)}
    </View>
  );
}

function SobrePlanes({ planes }: { planes: PlanRamo[] }) {
  return (
    <View style={s.planes}>
      {planes.map((p) =>
        p.sobre ? (
          <View key={p.codigo} style={s.plan} wrap={false}>
            <Text style={s.planNombre}>{p.nombre}</Text>
            <Text style={s.planTitular}>{p.sobre.titular}</Text>
            <Text style={s.planIntro}>{p.sobre.intro}</Text>
            {p.sobre.vinetas.map((v) => (
              <Text key={v.titulo + v.texto} style={s.vineta}>
                {v.titulo ? <Text style={s.vinetaTitulo}>{v.titulo}: </Text> : "• "}
                {v.texto}
              </Text>
            ))}
          </View>
        ) : null,
      )}
    </View>
  );
}

export function RamoPDF({ cotizacion: c, base }: { cotizacion: CotizacionRamo; base: string }) {
  registrarFuentes(base);
  const ramo = RAMOS[c.ramo];
  const opciones: OpcionArmada[] = c.opciones.map((o, i) => ({ ...o, datos: planDe(ramo, o.plan), numero: i + 1 }));
  const cliente = c.cliente.trim() || "tu cliente";
  const subtitulo = subtituloRamo(c);
  const planes = [...new Set(opciones.map((o) => o.plan))].map((codigo) => planDe(ramo, codigo));
  const conSobre = planes.filter((p) => p.sobre);
  const relevado = new Date(`${ramo.relevado}T12:00:00`).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const conLimites = filasDe(ramo).some((f) => f.limites);
  // Con una tabla larga (hogar) el glosario arranca en hoja nueva, como en auto; con una corta sigue en la misma hoja.
  const filasVisibles = filasDe(ramo).filter((f) => opciones.some((o) => lleva(f, o.datos, o))).length;

  return (
    <Document title={`Cotización para ${cliente}`} author={`${AGENCIA.nombre} · La Segunda Seguros`} subject={subtitulo} language="es-AR">
      <Page size="A4" style={estilosBase.pagina}>
        <Cabecera base={base} titulo={`Cotización para ${cliente}`} subtitulo={subtitulo} fecha={c.fecha} numero={c.numero} />

        {opciones.length > 0 && (
          <>
            <View style={estilosBase.seccion}>
              <View style={s.opciones}>
                {opciones.map((o) => (
                  <Tarjeta key={o.id} ramo={ramo} opcion={o} c={c} />
                ))}
              </View>
            </View>

            <View style={estilosBase.seccion}>
              <Text style={estilosBase.h2}>{opciones.length > 1 ? "Qué cubre cada opción" : "Qué cubre"}</Text>
              <Tabla ramo={ramo} opciones={opciones} c={c} />
            </View>

            <View break={filasVisibles > 12} style={filasVisibles > 12 ? {} : estilosBase.seccion}>
              {conSobre.length > 0 && (
                <View style={{ marginBottom: 14 }} wrap={false}>
                  <Text style={estilosBase.h2}>{conSobre.length > 1 ? "Cómo es cada plan" : "Cómo es el plan"}</Text>
                  <SobrePlanes planes={conSobre} />
                </View>
              )}
              <Glosario
                entradas={glosarioRamo(ramo, opciones)}
                titulo={
                  <>
                    <Text style={estilosBase.h2}>Qué significa cada cobertura</Text>
                    <Text style={s.intro}>
                      {ramo.cotizacion.introGlosario ?? "Las coberturas de tu cotización, explicadas con los términos de La Segunda."}
                    </Text>
                  </>
                }
              />
              {ramo.servicios && ramo.servicios.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Glosario
                    entradas={ramo.servicios.map((sv) => ({ id: sv.nombre, nombre: sv.nombre, variantes: [{ texto: sv.detalle, planes: [] }] }))}
                    titulo={<Text style={estilosBase.h2}>Servicios incluidos</Text>}
                  />
                </View>
              )}
              <Text style={estilosBase.aviso}>
                Cotización informativa preparada por {AGENCIA.nombre}. Los precios, las sumas aseguradas y las coberturas se confirman al
                emitir la póliza y se rigen por sus condiciones generales y particulares. Planes y coberturas según la información pública de La
                Segunda Seguros a {relevado}
                {conLimites ? ", con las sumas mínimas y máximas publicadas a esa fecha" : ""}.
              </Text>
            </View>
          </>
        )}

        <Pie base={base} />
      </Page>
    </Document>
  );
}
