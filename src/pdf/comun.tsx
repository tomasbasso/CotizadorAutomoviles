import { Circle, Font, Image, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { AGENCIA } from "@/config/agencia";
import { fechaLarga } from "@/lib/cotizacion";

export const ROJO = "#e20039";
export const ROJO_OSCURO = "#b91f38";
export const ROJO_VIVO = "#f42c4b";
export const ROJO_CLARO = "#ff4c60";
export const TINTA = "#231a1d";
export const SUAVE = "#6b5f63";
export const LINEA = "#ece3e6";
export const ROSA = "#fdf0f3";
export const SOBRE_ROJO = "#ffdbe3";

let fuentesListas = false;

export function registrarFuentes(base: string) {
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

export const MARGEN = 36;
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

/** Estilos que comparten todos los PDF de la agencia. */
export const estilosBase = StyleSheet.create({
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

export function Atencion({ color }: { color: string }) {
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
    <View style={estilosBase.mosaico}>
      {MOSAICO.map((fila, i) => (
        <View key={i} style={estilosBase.filaMosaico}>
          {fila.split("").map((c, j) => (
            <View key={j} style={[estilosBase.celdaMosaico, { backgroundColor: COLOR_MOSAICO[c] ?? ROJO }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Franja roja con el logo, el crédito de la agencia y el mosaico, seguida del título del documento. */
export function Cabecera({
  base: url,
  titulo,
  subtitulo,
  fecha,
  numero,
}: {
  base: string;
  titulo: string;
  subtitulo: string;
  fecha: Date;
  numero: string;
}) {
  return (
    <>
      <View style={estilosBase.franja}>
        <View style={estilosBase.franjaMarca}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- el Image de react-pdf no admite alt */}
          <Image src={`${url}/marca/logo-blanco.png`} style={estilosBase.logo} />
          <Text style={estilosBase.credito}>{AGENCIA.nombre}</Text>
        </View>
        <Mosaico />
      </View>

      <View style={estilosBase.intro}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={estilosBase.titulo}>{titulo}</Text>
          <Text style={estilosBase.subtitulo}>{subtitulo}</Text>
        </View>
        <View>
          <Text style={estilosBase.meta}>{fechaLarga(fecha)}</Text>
          <Text style={estilosBase.meta}>Nº {numero}</Text>
        </View>
      </View>
    </>
  );
}

export function Pie({ base: url }: { base: string }) {
  const contacto = [
    AGENCIA.productor && `Productor: ${AGENCIA.productor}`,
    AGENCIA.matricula && `Mat. SSN ${AGENCIA.matricula}`,
    AGENCIA.telefono && `Tel. ${AGENCIA.telefono}`,
    AGENCIA.whatsapp && `WhatsApp ${AGENCIA.whatsapp}`,
    AGENCIA.email,
    AGENCIA.direccion || AGENCIA.localidad,
  ].filter(Boolean);
  return (
    <View style={estilosBase.pie} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- el Image de react-pdf no admite alt */}
      <Image src={`${url}/marca/isotipo.png`} style={estilosBase.pieIsotipo} />
      <Text style={estilosBase.pieTexto}>
        <Text style={estilosBase.pieAgencia}>{AGENCIA.nombre} · La Segunda Seguros</Text>
        {contacto.length ? `   ${contacto.join(" · ")}` : ""}
      </Text>
      <Text style={estilosBase.piePagina} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}
