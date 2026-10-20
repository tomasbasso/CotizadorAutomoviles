import { Circle, Document, Font, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { AGENCIA } from "@/config/agencia";
import {
  type Cotizacion,
  fechaLarga,
  precioParaMostrar,
  franquiciaParaMostrar,
  textoPeriodo,
} from "@/lib/cotizacion";
import {
  COBERTURAS,
  type CoberturaId,
  type Fila,
  GRUPOS,
  type Plan,
  RELEVADO,
  advertenciaChoque,
  celdaDe,
  planPorCodigo,
} from "@/lib/planes";

const ROJO = "#e20039";
const ROJO_OSCURO = "#b91f38";
const ROJO_VIVO = "#f42c4b";
const ROJO_CLARO = "#ff4c60";
const TINTA = "#231a1d";
const SUAVE = "#6b5f63";
const LINEA = "#ece3e6";
const ROSA = "#fdf0f3";
const SOBRE_ROJO = "#ffdbe3";

let fuentesListas = false;

function registrarFuentes(base: string) {
  if (fuentesListas) return;
  Font.register({
    family: "Sora",
    fonts: [300, 400, 500, 600, 700].map((peso) => ({
      src: `${base}/fonts/Sora-${peso}.woff`,
      fontWeight: peso,
    })),
  });
  // Sin guiones de corte: el castellano no usa la división en sílabas del inglés.
  Font.registerHyphenationCallback((palabra) => [palabra]);
  fuentesListas = true;
}

const MARGEN = 36;
const ALTO_FRANJA = 78;
const CELDA_MOSAICO = ALTO_FRANJA / 5;

// Mosaico rojo de la guía de marca, dibujado como una escalera que sube hacia la derecha.
// o = rojo oscuro, v = rojo vibrante, c = rojo claro, . = queda el rojo de la franja.
const MOSAICO = [
  "........cv",
  "......cvov",
  "....cv.vco",
  "..cvoc.ovo",
  "cvovcovcov",
];
const COLOR_MOSAICO: Record<string, string> = { o: ROJO_OSCURO, v: ROJO_VIVO, c: ROJO_CLARO };

const s = StyleSheet.create({
  pagina: {
    fontFamily: "Sora",
    fontSize: 9,
    color: TINTA,
    paddingTop: MARGEN,
    paddingBottom: 42,
    paddingHorizontal: MARGEN,
  },
  franja: {
    marginTop: -MARGEN,
    marginHorizontal: -MARGEN,
    height: ALTO_FRANJA,
    backgroundColor: ROJO,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  franjaMarca: { paddingLeft: MARGEN, paddingTop: 17 },
  logo: { width: 124, height: (124 * 435) / 1891 },
  credito: {
    marginTop: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#ffffff",
    paddingLeft: 7,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },
  mosaico: { flexDirection: "column" },
  filaMosaico: { flexDirection: "row" },
  celdaMosaico: { width: CELDA_MOSAICO, height: CELDA_MOSAICO },

  intro: { marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  titulo: { fontSize: 19, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 },
  subtitulo: { marginTop: 4, fontSize: 10, color: SUAVE, lineHeight: 1.35 },
  meta: { fontSize: 8, color: SUAVE, textAlign: "right", lineHeight: 1.5 },

  seccion: { marginTop: 13 },
  h2: { fontSize: 11.5, fontWeight: 700, letterSpacing: -0.1, marginBottom: 5 },

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
  tarjetaArriba: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chip: {
    backgroundColor: ROJO,
    color: "#ffffff",
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    paddingHorizontal: 5,
    paddingTop: 2.5,
    paddingBottom: 2,
    borderRadius: 3,
  },
  chipSobreRojo: { backgroundColor: "#ffffff", color: ROJO },
  marcaOpcion: { fontSize: 6.5, fontWeight: 700, letterSpacing: 0.8, color: SUAVE },
  nombrePlan: { marginTop: 7, fontSize: 12, fontWeight: 700, letterSpacing: -0.2 },
  tipoPlan: { marginTop: 1.5, fontSize: 8, color: SUAVE },
  precio: { marginTop: 9, fontSize: 18, fontWeight: 700, letterSpacing: -0.4 },
  periodo: { fontSize: 7.5, color: SUAVE, marginTop: 1 },
  franquicia: { marginTop: 8, fontSize: 7.5, lineHeight: 1.35 },
  franquiciaMonto: { fontWeight: 700 },
  franquiciaDetalle: { fontSize: 7, lineHeight: 1.35, color: SUAVE },
  advertencia: { marginTop: 8, flexDirection: "row", alignItems: "flex-start" },
  advertenciaIcono: { marginTop: 0.8, marginRight: 4 },
  advertenciaTexto: { flex: 1, fontSize: 7, fontWeight: 500, lineHeight: 1.35, color: ROJO_OSCURO },

  tablaCabecera: { flexDirection: "row", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: TINTA },
  celdaEtiqueta: { flex: 1, paddingVertical: 4, paddingRight: 8 },
  celdaOpcion: { alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  cabeceraPlan: { fontSize: 8, fontWeight: 700, textAlign: "center", lineHeight: 1.25 },
  cabeceraOpcion: { fontSize: 6.5, color: SUAVE, textAlign: "center", marginTop: 1, marginBottom: 4 },
  grupo: { fontSize: 6.5, fontWeight: 700, color: ROJO, letterSpacing: 0.9, textTransform: "uppercase" },
  filaGrupo: { flexDirection: "row" },
  fila: { flexDirection: "row", minHeight: 12.4, borderBottomWidth: 0.5, borderBottomColor: LINEA },
  etiqueta: { fontSize: 8.3 },
  nota: { fontSize: 7, fontWeight: 700, color: ROJO },
  noCubre: { fontSize: 7, fontWeight: 600, color: SUAVE },
  glosarioEjemplo: { marginTop: 2.5, fontSize: 8, fontWeight: 500, color: TINTA, lineHeight: 1.4 },
  sinCobertura: { width: 7, height: 1.2, backgroundColor: "#cfc4c8" },

  glosarioColumnas: { flexDirection: "row", gap: 22 },
  glosarioColumna: { flex: 1 },
  glosario: { paddingVertical: 4.5, borderTopWidth: 0.5, borderTopColor: LINEA },
  glosarioNombre: { fontSize: 8.8, fontWeight: 600, lineHeight: 1.35, marginBottom: 1.5 },
  glosarioDetalle: { fontSize: 8, color: SUAVE, lineHeight: 1.4 },
  limite: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  limiteMonto: { fontSize: 8, fontWeight: 600, color: TINTA },
  introGlosario: { fontSize: 9, color: SUAVE, lineHeight: 1.45, marginBottom: 10, maxWidth: 420 },

  aviso: { marginTop: 12, fontSize: 7.2, color: SUAVE, lineHeight: 1.45 },

  pie: {
    position: "absolute",
    bottom: 16,
    left: MARGEN,
    right: MARGEN,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: LINEA,
    paddingTop: 7,
  },
  pieIsotipo: { width: 14, height: 14, marginRight: 8 },
  pieTexto: { flex: 1, fontSize: 7, color: SUAVE, lineHeight: 1.4 },
  pieAgencia: { fontWeight: 700, color: TINTA },
  piePagina: { fontSize: 7, color: SUAVE, marginLeft: 12 },
});

function Tilde() {
  return (
    <Svg width={9} height={9} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={5} fill={ROJO} />
      <Path
        d="M2.9 5.2 L4.4 6.6 L7.2 3.7"
        stroke="#ffffff"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function Atencion({ color }: { color: string }) {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={4.4} stroke={color} strokeWidth={1.1} fill="none" />
      <Path d="M5 2.7 L5 5.6" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Circle cx={5} cy={7.3} r={0.7} fill={color} />
    </Svg>
  );
}

function Mosaico() {
  return (
    <View style={s.mosaico}>
      {MOSAICO.map((fila, i) => (
        <View key={i} style={s.filaMosaico}>
          {fila.split("").map((c, j) => (
            <View key={j} style={[s.celdaMosaico, { backgroundColor: COLOR_MOSAICO[c] ?? ROJO }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

type OpcionArmada = Cotizacion["opciones"][number] & { datos: Plan; numero: number };

function Tarjeta({ opcion, periodo }: { opcion: OpcionArmada; periodo: string }) {
  const rojo = opcion.recomendada;
  const secundario = rojo ? { color: SOBRE_ROJO } : null;
  const franquicia = franquiciaParaMostrar(opcion);
  const advertencia = advertenciaChoque(opcion.datos);
  return (
    <View style={[s.tarjeta, rojo ? s.tarjetaRecomendada : {}]} wrap={false}>
      <View style={s.tarjetaArriba}>
        <Text style={[s.chip, rojo ? s.chipSobreRojo : {}]}>PLAN {opcion.datos.codigo}</Text>
        <Text style={[s.marcaOpcion, rojo ? { color: "#ffffff" } : {}]}>
          {rojo ? "RECOMENDADA" : `OPCIÓN ${opcion.numero}`}
        </Text>
      </View>
      <Text style={[s.nombrePlan, rojo ? { color: "#ffffff" } : {}]}>{opcion.datos.nombre}</Text>
      <Text style={[s.tipoPlan, secundario ?? {}]}>{opcion.datos.tipo}</Text>
      <Text style={[s.precio, rojo ? { color: "#ffffff" } : {}]}>
        {precioParaMostrar(opcion.precio) || "$ —"}
      </Text>
      <Text style={[s.periodo, secundario ?? {}]}>{periodo}</Text>
      {franquicia ? (
        <View style={{ marginTop: 8 }}>
          {franquicia.monto ? (
            <>
              <Text style={[s.franquicia, { marginTop: 0 }, rojo ? { color: "#ffffff" } : {}]}>
                Franquicia: <Text style={s.franquiciaMonto}>{franquicia.monto}</Text>
              </Text>
              {franquicia.porcentaje ? (
                <Text style={[s.franquiciaDetalle, secundario ?? {}]}>{franquicia.porcentaje}</Text>
              ) : null}
            </>
          ) : (
            <Text style={[s.franquicia, { marginTop: 0 }, rojo ? { color: "#ffffff" } : {}]}>
              Franquicia: {franquicia.porcentaje}
            </Text>
          )}
        </View>
      ) : null}
      {advertencia ? (
        <View style={s.advertencia}>
          <View style={s.advertenciaIcono}>
            <Atencion color={rojo ? "#ffffff" : ROJO_OSCURO} />
          </View>
          <Text style={[s.advertenciaTexto, rojo ? { color: "#ffffff" } : {}]}>{advertencia}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Tabla({ opciones }: { opciones: OpcionArmada[] }) {
  const ancho = opciones.length === 1 ? 120 : opciones.length === 2 ? 104 : 92;
  const columna: Columna = (o) => [s.celdaOpcion, { width: ancho }, o.recomendada ? { backgroundColor: ROSA } : {}];
  const grupos = GRUPOS.map((g) => ({
    ...g,
    filas: g.filas.filter((f) => f.aclararFalta || opciones.some((o) => celdaDe(f, o.datos).tipo !== "no")),
  })).filter((g) => g.filas.length > 0);

  return (
    <View>
      <View style={s.tablaCabecera} wrap={false}>
        <View style={s.celdaEtiqueta} />
        {opciones.map((o) => (
          <View key={o.id} style={columna(o)}>
            <Text style={[s.cabeceraPlan, o.recomendada ? { color: ROJO } : {}]}>{o.datos.nombre}</Text>
            <Text style={s.cabeceraOpcion}>Opción {o.numero}</Text>
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
              <FilaTabla fila={primera} opciones={opciones} columna={columna} />
            </View>
            {resto.map((f) => (
              <FilaTabla key={f.id} fila={f} opciones={opciones} columna={columna} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

type Columna = (o: OpcionArmada) => ComponentProps<typeof View>["style"];

function FilaTabla({ fila, opciones, columna }: { fila: Fila; opciones: OpcionArmada[]; columna: Columna }) {
  return (
    <View style={s.fila} wrap={false}>
      <View style={[s.celdaEtiqueta, { justifyContent: "center" }]}>
        <Text style={s.etiqueta}>{fila.nombre}</Text>
      </View>
      {opciones.map((o) => {
        const celda = celdaDe(fila, o.datos);
        return (
          <View key={o.id} style={columna(o)}>
            {celda.tipo === "si" && <Tilde />}
            {celda.tipo === "nota" && <Text style={s.nota}>{celda.texto}</Text>}
            {celda.tipo === "no" &&
              (fila.aclararFalta ? <Text style={s.noCubre}>No cubre</Text> : <View style={s.sinCobertura} />)}
          </View>
        );
      })}
    </View>
  );
}

function EntradaGlosario({ id }: { id: CoberturaId }) {
  const c = COBERTURAS[id];
  return (
    <View style={s.glosario} wrap={false}>
      <Text style={s.glosarioNombre}>{c.nombre}</Text>
      <Text style={s.glosarioDetalle}>{c.detalle}</Text>
      {c.ejemplo ? <Text style={s.glosarioEjemplo}>{c.ejemplo}</Text> : null}
      {c.limites &&
        Object.entries(c.limites).map(([tipo, monto]) => (
          <View key={tipo} style={s.limite}>
            <Text style={[s.glosarioDetalle, { flex: 1, paddingRight: 8 }]}>{tipo}</Text>
            <Text style={s.limiteMonto}>{monto}</Text>
          </View>
        ))}
    </View>
  );
}

/** Dos columnas parejas: se reparte por largo de texto para que ninguna quede mucho más alta. */
function Glosario({ opciones }: { opciones: OpcionArmada[] }) {
  const presentes = new Set<CoberturaId>(opciones.flatMap((o) => o.datos.coberturas));
  // Las coberturas de choque se explican siempre, aunque ninguna opción las tenga: es lo que el cliente tiene que saber que le falta.
  const ids = GRUPOS.flatMap((g) => g.filas.flatMap((f) => f.fuentes.filter((id) => f.aclararFalta || presentes.has(id))));
  // Alto estimado en líneas: ~44 caracteres por línea en el nombre y ~62 en el detalle a este ancho de columna.
  const peso = (id: CoberturaId) => {
    const c = COBERTURAS[id];
    const limites = Object.keys(c.limites ?? {}).length;
    const ejemplo = c.ejemplo ? Math.ceil(c.ejemplo.length / 62) : 0;
    return Math.ceil(c.nombre.length / 44) + Math.ceil(c.detalle.length / 62) + ejemplo + limites * 1.1 + 1;
  };
  const total = ids.reduce((suma, id) => suma + peso(id), 0);
  const izquierda: CoberturaId[] = [];
  const derecha: CoberturaId[] = [];
  let acumulado = 0;
  for (const id of ids) {
    // Va a la izquierda mientras quede más cerca de la mitad incluyéndola que sin ella.
    const conElla = acumulado + peso(id);
    if (derecha.length === 0 && Math.abs(conElla - total / 2) <= Math.abs(acumulado - total / 2)) {
      izquierda.push(id);
      acumulado = conElla;
    } else {
      derecha.push(id);
    }
  }
  return (
    <View style={s.glosarioColumnas}>
      {[izquierda, derecha].map((columna, i) => (
        <View key={i} style={s.glosarioColumna}>
          {columna.map((id) => (
            <EntradaGlosario key={id} id={id} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Pie({ base }: { base: string }) {
  const contacto = [
    AGENCIA.productor && `Productor: ${AGENCIA.productor}`,
    AGENCIA.matricula && `Mat. SSN ${AGENCIA.matricula}`,
    AGENCIA.telefono && `Tel. ${AGENCIA.telefono}`,
    AGENCIA.whatsapp && `WhatsApp ${AGENCIA.whatsapp}`,
    AGENCIA.email,
    AGENCIA.direccion || AGENCIA.localidad,
  ].filter(Boolean);
  return (
    <View style={s.pie} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- el Image de react-pdf no admite alt */}
      <Image src={`${base}/marca/isotipo.png`} style={s.pieIsotipo} />
      <Text style={s.pieTexto}>
        <Text style={s.pieAgencia}>{AGENCIA.nombre} · La Segunda Seguros</Text>
        {contacto.length ? `   ${contacto.join(" · ")}` : ""}
      </Text>
      <Text
        style={s.piePagina}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function CotizacionPDF({ cotizacion, base }: { cotizacion: Cotizacion; base: string }) {
  registrarFuentes(base);
  const opciones: OpcionArmada[] = cotizacion.opciones.map((o, i) => ({
    ...o,
    datos: planPorCodigo(o.plan),
    numero: i + 1,
  }));
  const periodo = textoPeriodo(cotizacion.periodo);
  const cliente = cotizacion.cliente.trim() || "tu cliente";
  const vehiculo = [
    cotizacion.vehiculo.trim() || "Vehículo a confirmar",
    cotizacion.anio.trim() && `Modelo ${cotizacion.anio.trim()}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const relevado = new Date(`${RELEVADO}T12:00:00`).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Cotización para ${cliente}`}
      author={`${AGENCIA.nombre} · La Segunda Seguros`}
      subject={`Seguro de auto · ${vehiculo}`}
      language="es-AR"
    >
      <Page size="A4" style={s.pagina}>
        <View style={s.franja}>
          <View style={s.franjaMarca}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- el Image de react-pdf no admite alt */}
            <Image src={`${base}/marca/logo-blanco.png`} style={s.logo} />
            <Text style={s.credito}>{AGENCIA.nombre}</Text>
          </View>
          <Mosaico />
        </View>

        <View style={s.intro}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={s.titulo}>Cotización para {cliente}</Text>
            <Text style={s.subtitulo}>Seguro de auto · {vehiculo}</Text>
          </View>
          <View>
            <Text style={s.meta}>{fechaLarga(cotizacion.fecha)}</Text>
            <Text style={s.meta}>Nº {cotizacion.numero}</Text>
          </View>
        </View>

        {opciones.length > 0 && (
          <>
            <View style={s.seccion}>
              <View style={s.opciones}>
                {opciones.map((o) => (
                  <Tarjeta key={o.id} opcion={o} periodo={periodo} />
                ))}
              </View>
            </View>

            <View style={s.seccion}>
              <Text style={s.h2}>{opciones.length > 1 ? "Qué cubre cada opción" : "Qué cubre"}</Text>
              <Tabla opciones={opciones} />
            </View>

            <View break>
              <Text style={s.h2}>Qué significa cada cobertura</Text>
              <Text style={s.introGlosario}>
                Las coberturas de tu cotización, explicadas con los términos de La Segunda.
              </Text>
              <Glosario opciones={opciones} />
              <Text style={s.aviso}>
                Cotización informativa preparada por {AGENCIA.nombre}. Los precios y las coberturas se
                confirman al emitir la póliza y se rigen por sus condiciones generales y particulares.
                Coberturas y límites de Responsabilidad Civil según la información pública de La Segunda
                Seguros a {relevado}.
              </Text>
            </View>
          </>
        )}

        <Pie base={base} />
      </Page>
    </Document>
  );
}
